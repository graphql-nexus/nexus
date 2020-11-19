import {
  getNamedType,
  GraphQLInputType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLOutputType,
  GraphQLType,
} from 'graphql'
import { isNexusWrappingType } from '../core'
import { GraphQLNamedInputType, GraphQLNamedOutputType } from '../definitions/_types'
import { plugin } from '../plugin'
import { printedGenTyping } from '../utils'

const FieldDefTypes = [
  printedGenTyping({
    name: 'nullable',
    type: 'boolean',
    optional: true,
    description: `\
Whether the field can be null
@default (depends on whether nullability is configured in type or schema)
`,
  }),
  printedGenTyping({
    name: 'list',
    type: 'true | boolean[]',
    optional: true,
    description: `\
Whether the field is list of values, or just a single value.

If list is true, we assume the field is a list. If list is an array,
we'll assume that it's a list with the depth. The boolean indicates whether
the field is required (non-null).`,
  }),
]

const ArgDefTypes = [
  printedGenTyping({
    name: 'required',
    type: 'boolean',
    optional: true,
    description: `\
Whether the arg should be non null, \`required: true\` = \`nullable: false\`
@default (depends on whether nullability is configured in type or schema)
  `,
  }),
  printedGenTyping({
    name: 'nullable',
    type: 'boolean',
    optional: true,
    description: `\
Whether the arg can be null
@default (depends on whether nullability is configured in type or schema)
  `,
  }),
  printedGenTyping({
    name: 'list',
    type: 'true | boolean[]',
    optional: true,
    description: `\
Whether the field is list of values, or just a single value.

If list is true, we assume the field is a list. If list is an array,
we'll assume that it's a list with the depth. The boolean indicates whether
the field is required (non-null).`,
  }),
]

export const nullableListPlugin = () => {
  return plugin({
    name: 'nullableList',
    fieldDefTypes: FieldDefTypes,
    argTypeDefTypes: ArgDefTypes,
    description: 'Adds back the nullable/list API for retro-compatibility',
    onOutputFieldDefinition(field, fieldConfig, builder) {
      const nullable: boolean | undefined = (fieldConfig as any).nullable
      const list: true | boolean[] | undefined = (fieldConfig as any).list

      // If none of the options are used, stop here
      if (nullable === undefined && list === undefined) {
        return
      }

      if (isNexusWrappingType(fieldConfig.type)) {
        if (list !== undefined) {
          throw new Error(
            `It looks like you used list: true and wrapped your type for ${fieldConfig.name}. You should only do one or the other`
          )
        }

        if (nullable !== undefined) {
          throw new Error(
            `It looks like you used nullable: true and wrapped your type for ${fieldConfig.name}. You should only do one or the other`
          )
        }
        return
      }

      const nonNullDefault = builder.getConfigOption('nonNullDefaults').output

      field.type = decorateType(
        getNamedType(field.type) as GraphQLNamedOutputType,
        list,
        nullable !== undefined ? !nullable : nonNullDefault
      )

      return field
    },
    onInputFieldDefinition(field, fieldConfig, builder) {
      const nullable: boolean | undefined = (fieldConfig as any).nullable
      const list: true | boolean[] | undefined = (fieldConfig as any).list

      // If none of the options are used, stop here
      if (nullable === undefined && list === undefined) {
        return
      }

      if (isNexusWrappingType(fieldConfig.type)) {
        if (list !== undefined) {
          throw new Error(
            `It looks like you used list: true and wrapped your type for ${fieldConfig.name}. You should only do one or the other`
          )
        }

        if (nullable !== undefined) {
          throw new Error(
            `It looks like you used nullable: true and wrapped your type for ${fieldConfig.name}. You should only do one or the other`
          )
        }
        return
      }

      const nonNullDefault = builder.getConfigOption('nonNullDefaults').input

      field.type = decorateType(
        getNamedType(field.type) as GraphQLNamedInputType,
        list,
        nullable !== undefined ? !nullable : nonNullDefault
      )

      return field
    },
    onArgDefinition(arg, argConfig, fieldConfig, parentTypeConfig, builder) {
      const nullable: boolean | undefined = (argConfig.value as any).nullable
      const required: boolean | undefined = (argConfig.value as any).required
      const list: true | boolean[] | undefined = (argConfig.value as any).list

      // If none of the options are used, stop here
      if (nullable === undefined && list === undefined && required === undefined) {
        return
      }

      if (nullable !== undefined && required !== undefined) {
        throw new Error('It looks like you used nullable and required. You should only use one or the other')
      }

      if (isNexusWrappingType(argConfig.value.type)) {
        if (list !== undefined) {
          throw new Error(
            `It looks like you used list: true and wrapped the type of the arg "${argConfig.name}" of the field "${fieldConfig.name}" of the parent type "${parentTypeConfig.name}". You should only do one or the other`
          )
        }

        if (nullable !== undefined) {
          throw new Error(
            `It looks like you used nullable: true and wrapped the type of the arg "${argConfig.name}" of the field "${fieldConfig.name}" of the parent type "${parentTypeConfig.name}". You should only do one or the other`
          )
        }
        return
      }

      const nonNullDefault = builder.getConfigOption('nonNullDefaults').input

      arg.type = decorateType(
        getNamedType(arg.type) as GraphQLNamedInputType,
        list,
        nullable !== undefined ? !nullable : nonNullDefault
      )

      return arg
    },
  })
}

function decorateType(
  type: GraphQLNamedOutputType,
  list: null | undefined | true | boolean[],
  isNonNull: boolean
): GraphQLOutputType
function decorateType(
  type: GraphQLNamedInputType,
  list: null | undefined | true | boolean[],
  isNonNull: boolean
): GraphQLInputType
function decorateType(
  type: GraphQLNamedInputType | GraphQLNamedOutputType,
  list: null | undefined | true | boolean[],
  isNonNull: boolean
): GraphQLInputType | GraphQLOutputType {
  if (list) {
    return decorateList(type, list, isNonNull)
  }

  return isNonNull ? GraphQLNonNull(type) : type
}

function decorateList<T extends GraphQLOutputType | GraphQLInputType>(
  type: T,
  isList: true | boolean[],
  isNonNull: boolean
): T {
  let finalType = type

  if (!Array.isArray(isList)) {
    if (isNonNull) {
      finalType = GraphQLNonNull(finalType) as T
    }
    return GraphQLList(finalType) as T
  }
  if (Array.isArray(isList)) {
    for (let i = 0; i < isList.length; i++) {
      const isNull = !isList[i]
      if (!isNull) {
        finalType = GraphQLNonNull(finalType) as T
      }
      finalType = GraphQLList(finalType) as T
    }
  }
  return finalType
}
