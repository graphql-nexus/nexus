import { assertValidName, GraphQLObjectType } from 'graphql'
import type { InterfaceFieldsFor } from '../typegenTypeHelpers'
import { OutputDefinitionBlock, OutputDefinitionBuilder } from './definitionBlocks'
import type { FieldModification, FieldModificationDef, Implemented } from './interfaceType'
import { AbstractTypes, Maybe, NexusTypes, NonNullConfig, SourceTypingDef, withNexusSymbol } from './_types'

export interface ObjectDefinitionBuilder extends OutputDefinitionBuilder {
  addInterfaces(toAdd: Implemented[]): void
  addModification(toAdd: FieldModificationDef<any, any>): void
}

export class ObjectDefinitionBlock<TypeName extends string> extends OutputDefinitionBlock<TypeName> {
  constructor(protected typeBuilder: ObjectDefinitionBuilder) {
    super(typeBuilder)
  }
  /** @param interfaceName */
  implements(...interfaceName: Array<Implemented>) {
    this.typeBuilder.addInterfaces(interfaceName)
  }
  /** Modifies a field added via an interface */
  modify<FieldName extends Extract<InterfaceFieldsFor<TypeName>, string>>(
    field: FieldName,
    modifications: FieldModification<TypeName, FieldName>
  ) {
    this.typeBuilder.addModification({ ...modifications, field })
  }
}

/** Configuration object to specify an object's name, fields, and more. */
export type NexusObjectTypeConfig<TypeName extends string> = {
  /**
   * [GraphQL 2018 Spec](https://spec.graphql.org/June2018/#Name)
   *
   * The name of this object type. Must conform to the pattern:
   *
   * [_A-Za-z][_0-9A-Za-z]*
   *
   * From the spec: Names in GraphQL are case‐sensitive. That is to say name, Name, and NAME all refer to
   * dfferent names. Underscores are significant, which means other_name and othername are two different names.
   *
   * @example
   *   'Post'
   *
   * @example
   *   'User2'
   *
   * @example
   *   'comment'
   *
   * @example
   *   'User_Timeline'
   */
  name: TypeName
  /**
   * [Nullability Guide](https://nxs.li/guides/nullability)
   *
   * Configures the default nullability for fields and arguments in this object.
   *
   * Default :: By default inherits from the global nonNullDefaults configuration found in makeSchema.
   *
   * @example
   *   const User = objectType({
   *     name: 'User',
   *     nonNullDefaults: {
   *       input: true, // field args, input object type fields
   *       output: false, // object type fields
   *     },
   *     definition(t) {
   *       t.string('location', {
   *         args: {
   *           language: stringArg(),
   *         },
   *       })
   *     },
   *   })
   *
   *   // GraphQL SDL
   *   // -----------
   *   //
   *   // type User {
   *   //   location(language: String!): String
   *   // }
   */
  nonNullDefaults?: NonNullConfig
  /**
   * [GraphQL 2018 Spec](https://spec.graphql.org/June2018/#sec-Descriptions)
   *
   * The description for this object type.
   *
   * Various GraphQL tools will make use of this information but it has zero runtime impact. The value given
   * here will also be included as heredocs in the generated GraphQL SDL file.
   *
   * Default :: By default there will be no description
   *
   * @example
   *   'Little description to help you along!'
   *
   *   // GraphQL SDL
   *   // -----------
   *   // """Little description to help you along!"""
   *   // type YOUR_TYPE_NAME {
   *   //   # ...
   *   // }
   */
  description?: Maybe<string>
  /**
   * [Source Types Guide](https://nxs.li/guides/backing-types)
   *
   * Specify the Source Type for this object type.
   *
   * You can give a literal TypeScript type written as a string or give the location of a module that exports a type.
   *
   * Default :: By default the source type of this object will be whatever you configured in makeSchema, if
   * anything, otherwise simply 1:1 with how you have defined this object type.
   *
   * @example
   *   '{ foo: string; qux: number; bar: boolean }'
   *
   * @example
   *   {
   *   "module": "some-package",
   *   "export": "User"
   *   }
   *
   * @example
   *   {
   *   module: `${__dirname}/some/module.ts`,
   *   export: 'User',
   *   }
   */
  sourceType?: SourceTypingDef
  /**
   * Data that will be added to the field-level [extensions field on the graphql-js type def
   * instances](https://github.com/graphql/graphql-js/issues/1527) resulting from makeSchema. Useful for some
   * graphql-js based tools like [join-monster](https://github.com/join-monster/join-monster) which rely on
   * looking for special data here.
   *
   * @example
   *   // taken from: https://github.com/graphql-nexus/schema/issues/683#issuecomment-735711640
   *
   *   const User = objectType({
   *     name: 'User',
   *     extensions: {
   *       joinMonster: {
   *         sqlTable: 'USERS',
   *         uniqueKey: 'USER_ID',
   *       },
   *     },
   *     definition(t) {
   *       t.id('id', {
   *         extensions: {
   *           joinMonster: {
   *             sqlColumn: 'USER_ID',
   *           },
   *         },
   *       })
   *     },
   *   })
   */
  extensions?: GraphQLObjectType['extensions']
  /**
   * Define the fields of your object type.
   *
   * This method receives a type builder api that you will use to define the fields of your object type
   * within. You can leverage conditionals, loops, other functions (that take the builder api as an
   * argument), pull in variables from higher scopes, and so on, to help define your fields. However avoid two things:
   *
   * 1. Doing asynchronous work when defining fields. 2. Triggering side-effects that you would NOT want run
   * at *build* time––as this code will run during build
   *     to support [Nexus' reflection system](https://nxs.li/guides/reflection).
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field('name', { type: 'String' })
   *       t.string('status')
   *       t.list.list.int('foo')
   *       t.nullable.boolean('visible')
   *       t.list.nonNull.field('friends', {
   *         type: 'Friend',
   *         // ...
   *       })
   *     },
   *   })
   *
   * @param t The type builder API for object types. The primary method you'll find is "t.field" but there are
   *     many convenient shorthands available as well, plus anything plugins have added. Explore each one's
   *     jsDoc for more detail.
   */
  definition(t: ObjectDefinitionBlock<TypeName>): void
  /** Adds this type as a method on the Object/Interface definition blocks */
  asNexusMethod?: string
} & AbstractTypes.MaybeTypeDefConfigFieldIsTypeOf<TypeName> &
  NexusGenPluginTypeConfig<TypeName>

export class NexusObjectTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusObjectTypeConfig<TypeName>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusObjectTypeDef, NexusTypes.Object)

/**
 * [API Docs](https://nxs.li/docs/api/object-type) | [GraphQL.org
 * Docs](https://graphql.org/learn/schema/#object-types-and-fields) | [GraphQL 2018
 * Spec](https://spec.graphql.org/June2018/#sec-Objects)
 *
 * Define a GraphQL Object Type.
 *
 * Object types are typically the most common kind of type present in a GraphQL schema. You give them a name
 * and fields that model your domain. Fields are typed and can point to yet another object type you've defined.
 *
 * @example
 *   const Post = objectType({
 *     name: 'Post',
 *     definition(t) {
 *       t.int('id')
 *       t.string('title')
 *     },
 *   })
 *
 * @param config Specify your object's name, its fields, and more. See each config property's jsDoc for more detail.
 */
export function objectType<TypeName extends string>(config: NexusObjectTypeConfig<TypeName>) {
  return new NexusObjectTypeDef<TypeName>(config.name, config)
}
