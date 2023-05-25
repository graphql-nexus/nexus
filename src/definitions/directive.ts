import {
  ArgumentNode,
  assertName,
  astFromValue,
  ASTKindToNode,
  DirectiveNode,
  GraphQLDirective,
  GraphQLDirectiveConfig,
  Kind,
} from 'graphql'
import { GetGen, GetGen2, NexusWrappedSymbol } from '../core'
import type { MaybeReadonlyArray } from '../typeHelpersInternal'
import { mapObj } from '../utils'
import type { ArgsRecord } from './args'
import { isNexusDirective, isNexusDirectiveUse } from './wrapping'
import { Maybe, NexusTypes, withNexusSymbol } from './_types'

export type Directives = MaybeReadonlyArray<NexusDirectiveDef | GraphQLDirective | NexusDirectiveUse>

export const RequestDirectiveLocation = [
  /** Request Definitions */
  'QUERY',
  'MUTATION',
  'SUBSCRIPTION',
  'FIELD',
  'FRAGMENT_DEFINITION',
  'FRAGMENT_SPREAD',
  'INLINE_FRAGMENT',
  'VARIABLE_DEFINITION',
] as const

export const SchemaDirectiveLocation = [
  /** Type System Definitions */
  'SCHEMA',
  'SCALAR',
  'OBJECT',
  'FIELD_DEFINITION',
  'ARGUMENT_DEFINITION',
  'INTERFACE',
  'UNION',
  'ENUM',
  'ENUM_VALUE',
  'INPUT_OBJECT',
  'INPUT_FIELD_DEFINITION',
] as const

export type SchemaDirectiveLocationEnum = typeof SchemaDirectiveLocation[number]

export type RequestDirectiveLocationEnum = typeof RequestDirectiveLocation[number]

export interface NexusDirectiveConfig<DirectiveName extends string = string> {
  /** Name of the directive */
  name: DirectiveName
  /** The description to annotate the GraphQL SDL */
  description?: string
  /** Valid locations that this directive may be used */
  locations: MaybeReadonlyArray<SchemaDirectiveLocationEnum | RequestDirectiveLocationEnum>
  /** Whether the directive can be repeated */
  isRepeatable?: Maybe<boolean> | undefined
  /**
   * [GraphQL.org Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
   * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
   *
   * Define arguments for this directive.
   *
   * All directives in GraphQL can have arguments defined for them. Nexus provides a number of helpers for
   * defining arguments. All builtin GraphQL scalar types have helpers named "{scalarName}Arg" such as
   * "stringArg" and "intArg". You can also use type modifier helpers "[list](https://nxs.li/docs/api/list)"
   * "[nullable](https://nxs.li/docs/api/nullable)" and "[nonNull](https://nxs.li/docs/api/nonNull)". For
   * details about nonNull/nullable refer to the [nullability guide](https://nxs.li/guides/nullability).
   *
   * @example
   *   export const TestValue = directive({
   *     name: 'TestValue',
   *     description: 'Denotes the value used when testing this type',
   *     args: {
   *       type: enumType({
   *         name: 'TestValueType',
   *         members: ['String', 'Int', 'Float', 'JSON'],
   *       }),
   *       value: stringArg(),
   *       listLength: intArg(),
   *     },
   *     locations: ['FIELD_DEFINITION'],
   *   })
   */
  args?: ArgsRecord
  /** Data that will be added to the directive extensions field on the graphql-js type def instances */
  extensions?: GraphQLDirectiveConfig['extensions']
}

export interface NexusDirectiveDef<DirectiveName extends string = string> {
  (...args: MaybeArgsFor<DirectiveName>): NexusDirectiveUse<DirectiveName>
  value: NexusDirectiveConfig
  [NexusWrappedSymbol]: 'Directive'
}

export class NexusDirectiveUse<DirectiveName extends string = string> {
  constructor(
    readonly name: DirectiveName,
    readonly args: MaybeArgsFor<DirectiveName>[0] | undefined,
    readonly config?: NexusDirectiveConfig<DirectiveName>
  ) {}
}

withNexusSymbol(NexusDirectiveUse, NexusTypes.DirectiveUse)

/** Defines a directive, which can be used positionally when generating the SDL */
export function directive<DirectiveName extends string>(
  config: NexusDirectiveConfig<DirectiveName>
): NexusDirectiveDef<DirectiveName> {
  assertName(config.name)

  config = Object.freeze(config)

  function addDirective(...args: MaybeArgsFor<DirectiveName>) {
    return new NexusDirectiveUse(config.name, args[0], config)
  }

  addDirective[NexusWrappedSymbol] = NexusTypes.Directive as 'Directive'

  addDirective.value = config

  return addDirective
}

type MaybeArgsFor<DirectiveName extends string> = GetGen2<'directiveArgs', DirectiveName> extends object
  ? [GetGen2<'directiveArgs', DirectiveName>]
  : []

export function addDirective<DirectiveName extends GetGen<'directives', string>>(
  directiveName: DirectiveName,
  ...args: MaybeArgsFor<DirectiveName>
) {
  return new NexusDirectiveUse<DirectiveName>(directiveName, args[0])
}

const DirectiveASTKindMapping = {
  SCALAR: Kind.SCALAR_TYPE_DEFINITION, // 'ScalarTypeDefinition',
  SCHEMA: Kind.SCHEMA_DEFINITION, // 'SchemaDefinition',
  OBJECT: Kind.OBJECT_TYPE_DEFINITION, // 'ObjectTypeDefinition',
  FIELD_DEFINITION: Kind.FIELD_DEFINITION, // 'FieldDefinition',
  ARGUMENT_DEFINITION: Kind.INPUT_VALUE_DEFINITION, // 'InputValueDefinition',
  INTERFACE: Kind.INTERFACE_TYPE_DEFINITION, // 'InterfaceTypeDefinition',
  UNION: Kind.UNION_TYPE_DEFINITION, // 'UnionTypeDefinition',
  ENUM: Kind.ENUM_TYPE_DEFINITION, // 'EnumTypeDefinition',
  ENUM_VALUE: Kind.ENUM_VALUE_DEFINITION, // 'EnumValueDefinition',
  INPUT_OBJECT: Kind.INPUT_OBJECT_TYPE_DEFINITION, // 'InputObjectTypeDefinition',
  INPUT_FIELD_DEFINITION: Kind.INPUT_VALUE_DEFINITION, // 'InputValueDefinition',
} as const

type DirectiveASTKindMapping = typeof DirectiveASTKindMapping
export type DirectiveASTKinds = keyof DirectiveASTKindMapping

/**
 * Creates the ASTNode with the directives
 *
 * @param
 */
export function maybeAddDirectiveUses<
  Kind extends DirectiveASTKinds,
  Result extends { astNode: ASTKindToNode[DirectiveASTKindMapping[Kind]] }
>(
  kind: Kind,
  directiveUses: Directives | undefined,
  customDirectives: Record<string, GraphQLDirective>
): Result | undefined {
  if (!directiveUses?.length) {
    return undefined
  }
  const seenDirectives = new Set<string>()
  return {
    astNode: {
      kind: DirectiveASTKindMapping[kind],
      directives: Array.from(directiveUses).map((d): DirectiveNode => {
        const directiveName = isNexusDirective(d) ? d.value.name : d.name
        const directiveDef = customDirectives[directiveName]
        if (seenDirectives.has(directiveName) && !directiveDef.isRepeatable) {
          throw new Error(`Cannot use directive ${directiveName} more than once in a row`)
        }
        assertValidDirectiveFor(kind, directiveDef)
        seenDirectives.add(directiveName)

        const args = isNexusDirectiveUse(d) ? directiveArgs(d, directiveDef) : undefined

        return {
          kind: Kind.DIRECTIVE,
          name: {
            kind: Kind.NAME,
            value: directiveName,
          },
          arguments: args,
        }
      }),
    },
  } as any
}

function assertValidDirectiveFor(
  kind: DirectiveASTKinds,
  directiveDef: GraphQLDirective & { locations: readonly any[] } // any is a hack to make this work w/ v15 & 16
) {
  if (!directiveDef.locations.includes(kind)) {
    throw new Error(`Directive ${directiveDef.name} cannot be applied to ${kind}`)
  }
}

function directiveArgs(
  directiveUse: NexusDirectiveUse,
  directiveDef: GraphQLDirective
): ReadonlyArray<ArgumentNode> {
  return mapObj(directiveUse.args ?? {}, (val, key) => {
    const arg = directiveDef.args.find((a) => a.name === key)
    if (!arg) {
      throw new Error(`Unknown directive arg ${key}, expected one of ${directiveDef.args.map((a) => a.name)}`)
    }
    const value = astFromValue(val, arg.type)
    if (!value) {
      throw new Error(`Unable to get ast for ${key}`)
    }
    return {
      kind: Kind.ARGUMENT,
      name: {
        kind: Kind.NAME,
        value: key,
      },
      value,
    }
  })
}
