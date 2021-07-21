/** Conveniently represents flow's "Maybe" type https://flow.org/en/docs/types/maybe/ */
type Maybe<T> = null | undefined | T

import { DirectiveNode, print } from 'graphql'
import { printBlockString, invariant, inspect } from './graphqlInternal'

import type { GraphQLSchema } from 'graphql'
import type { GraphQLDirective } from 'graphql'
import type {
  GraphQLNamedType,
  GraphQLArgument,
  GraphQLInputField,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLInputObjectType,
} from 'graphql'
import { isIntrospectionType } from 'graphql'
import { isSpecifiedScalarType } from 'graphql'
import { DEFAULT_DEPRECATION_REASON, isSpecifiedDirective } from 'graphql'
import {
  isScalarType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
} from 'graphql'

import { astFromValue } from 'graphql'

export function printSchemaWithDirectives(schema: GraphQLSchema): string {
  return printFilteredSchemaWithDirectives(schema, (n) => !isSpecifiedDirective(n), isDefinedType)
}

function isDefinedType(type: GraphQLNamedType): boolean {
  return !isSpecifiedScalarType(type) && !isIntrospectionType(type)
}

function printFilteredSchemaWithDirectives(
  schema: GraphQLSchema,
  directiveFilter: (type: GraphQLDirective) => boolean,
  typeFilter: (type: GraphQLNamedType) => boolean
): string {
  const directives = schema.getDirectives().filter(directiveFilter)
  const types = Object.values(schema.getTypeMap()).filter(typeFilter)

  return [
    printSchemaDefinition(schema),
    ...directives.map((directive) => printDirective(directive)),
    ...types.map((type) => printType(type)),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function printSchemaDefinition(
  // & description for GraphQL 14 types
  schema: GraphQLSchema & { description?: Maybe<string> }
): Maybe<string> {
  if (schema.description == null && isSchemaOfCommonNames(schema)) {
    return
  }

  const operationTypes = []

  const queryType = schema.getQueryType()
  if (queryType) {
    operationTypes.push(`  query: ${queryType.name}`)
  }

  const mutationType = schema.getMutationType()
  if (mutationType) {
    operationTypes.push(`  mutation: ${mutationType.name}`)
  }

  const subscriptionType = schema.getSubscriptionType()
  if (subscriptionType) {
    operationTypes.push(`  subscription: ${subscriptionType.name}`)
  }

  return printDescription(schema) + `schema {\n${operationTypes.join('\n')}\n}`
}

/**
 * GraphQL schema define root types for each type of operation. These types are the same as any other type and
 * can be named in any manner, however there is a common naming convention:
 *
 * ```graphql
 *     query: Query
 *     mutation: Mutation
 *     subscription: Subscription } ```
 *
 * When using this naming convention, the schema description can be omitted.
 * ```
 */
function isSchemaOfCommonNames(schema: GraphQLSchema): boolean {
  const queryType = schema.getQueryType()
  if (queryType && queryType.name !== 'Query') {
    return false
  }

  const mutationType = schema.getMutationType()
  if (mutationType && mutationType.name !== 'Mutation') {
    return false
  }

  const subscriptionType = schema.getSubscriptionType()
  if (subscriptionType && subscriptionType.name !== 'Subscription') {
    return false
  }

  return true
}

export function printType(type: GraphQLNamedType): string {
  if (isScalarType(type)) {
    return printScalar(type)
  }
  if (isObjectType(type)) {
    return printObject(type)
  }
  if (isInterfaceType(type)) {
    return printInterface(type)
  }
  if (isUnionType(type)) {
    return printUnion(type)
  }
  if (isEnumType(type)) {
    return printEnum(type)
  }
  // istanbul ignore else (See: 'https://github.com/graphql/graphql-js/issues/2618')
  if (isInputObjectType(type)) {
    return printInputObject(type)
  }

  // istanbul ignore next (Not reachable. All possible types have been considered)
  invariant(false, 'Unexpected type: ' + inspect(type))
}

function printScalar(type: GraphQLScalarType): string {
  return printDescription(type) + `scalar ${type.name}` + printSpecifiedByURL(type) + printDirectives(type)
}

function printImplementedInterfaces(
  // & getInterfaces added for GraphQL 14 types
  type: (GraphQLObjectType | GraphQLInterfaceType) & { getInterfaces?: () => GraphQLInterfaceType[] }
): string {
  const interfaces = type.getInterfaces?.()
  return interfaces?.length ? ' implements ' + interfaces.map((i) => i.name).join(' & ') : ''
}

function printObject(type: GraphQLObjectType): string {
  return (
    printDescription(type) +
    `type ${type.name}` +
    printImplementedInterfaces(type) +
    printDirectives(type) +
    printFields(type)
  )
}

function printInterface(type: GraphQLInterfaceType): string {
  return (
    printDescription(type) +
    `interface ${type.name}` +
    printImplementedInterfaces(type) +
    printDirectives(type) +
    printFields(type)
  )
}

function printUnion(type: GraphQLUnionType): string {
  const types = type.getTypes()
  const possibleTypes = types.length ? ' = ' + types.join(' | ') : ''
  return printDescription(type) + 'union ' + type.name + printDirectives(type) + possibleTypes
}

function printEnum(type: GraphQLEnumType): string {
  const values = type
    .getValues()
    .map(
      (value, i) =>
        printDescription(value, '  ', !i) +
        '  ' +
        value.name +
        printDeprecated(value.deprecationReason) +
        printDirectives(value)
    )

  return printDescription(type) + `enum ${type.name}` + printDirectives(type) + printBlock(values)
}

function printInputObject(type: GraphQLInputObjectType): string {
  const fields = Object.values(type.getFields()).map(
    (f, i) => printDescription(f, '  ', !i) + '  ' + printInputValue(f)
  )
  return printDescription(type) + `input ${type.name}` + printDirectives(type) + printBlock(fields)
}

function printFields(type: GraphQLObjectType | GraphQLInterfaceType): string {
  const fields = Object.values(type.getFields()).map(
    (f, i) =>
      printDescription(f, '  ', !i) +
      '  ' +
      f.name +
      printArgs(f.args, '  ') +
      ': ' +
      String(f.type) +
      printDeprecated(f.deprecationReason) +
      printDirectives(f)
  )
  return printBlock(fields)
}

function printBlock(items: ReadonlyArray<string>): string {
  return items.length !== 0 ? ' {\n' + items.join('\n') + '\n}' : ''
}

function printArgs(args: ReadonlyArray<GraphQLArgument>, indentation: string = ''): string {
  if (args.length === 0) {
    return ''
  }

  // If every arg does not have a description, print them on one line.
  if (args.every((arg) => !arg.description)) {
    return '(' + args.map(printInputValue).join(', ') + ')'
  }

  return (
    '(\n' +
    args
      .map(
        (arg, i) => printDescription(arg, '  ' + indentation, !i) + '  ' + indentation + printInputValue(arg)
      )
      .join('\n') +
    '\n' +
    indentation +
    ')'
  )
}

function printInputValue(arg: GraphQLInputField & { deprecationReason?: Maybe<string> }): string {
  const defaultAST = astFromValue(arg.defaultValue, arg.type)
  let argDecl = arg.name + ': ' + String(arg.type)
  if (defaultAST) {
    argDecl += ` = ${print(defaultAST)}`
  }
  return argDecl + printDeprecated(arg.deprecationReason) + printDirectives(arg)
}

function printDirective(directive: GraphQLDirective): string {
  return (
    printDescription(directive) +
    'directive @' +
    directive.name +
    printArgs(directive.args) +
    (directive.isRepeatable ? ' repeatable' : '') +
    ' on ' +
    directive.locations.join(' | ')
  )
}

function printDeprecated(reason: Maybe<string>): string {
  if (reason == null) {
    return ''
  }
  if (reason !== DEFAULT_DEPRECATION_REASON) {
    const astValue = print({ kind: 'StringValue', value: reason })
    return ` @deprecated(reason: ${astValue})`
  }
  return ' @deprecated'
}

function printSpecifiedByURL(
  // https://github.com/graphql/graphql-js/issues/3156
  scalar: GraphQLScalarType & { specifiedByURL?: Maybe<string>; specifiedByUrl?: Maybe<string> }
): string {
  const specifiedByURL = scalar.specifiedByURL ?? scalar.specifiedByUrl
  if (specifiedByURL == null) {
    return ''
  }
  const astValue = print({ kind: 'StringValue', value: specifiedByURL })
  return ` @specifiedBy(url: ${astValue})`
}

function printDescription(
  def: { readonly description?: Maybe<string> },
  indentation: string = '',
  firstInBlock: boolean = true
): string {
  const { description } = def
  if (description == null) {
    return ''
  }

  const preferMultipleLines = description.length > 70
  const blockString = printBlockString(description, preferMultipleLines)
  const prefix = indentation && !firstInBlock ? '\n' + indentation : indentation

  return prefix + blockString.replace(/\n/g, '\n' + indentation) + '\n'
}

function printDirectives(value: { astNode?: Maybe<{ readonly directives?: ReadonlyArray<DirectiveNode> }> }) {
  const directives = value.astNode?.directives
  if (!directives?.length) {
    return ''
  }
  return ' ' + directives.map(printDirectiveUse).join(' ')
}

function printDirectiveUse(node: DirectiveNode) {
  return `@${node.name.value}` + printDirectiveArgs(node)
}

function printDirectiveArgs(node: DirectiveNode) {
  if (!node.arguments?.length) {
    return ''
  }
  return `(${node.arguments.map((a) => `${a.name.value}: ${print(a.value)}`).join(', ')})`
}
