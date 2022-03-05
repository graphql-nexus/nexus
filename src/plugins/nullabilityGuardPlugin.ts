import {
  GraphQLNullableType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  isEnumType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
  isWrappingType,
} from 'graphql'
import { forEach } from 'iterall'
import type { GraphQLPossibleOutputs } from '../definitions/_types'
import type { NexusGraphQLNamedType } from '../extensions'
import { CreateFieldResolverInfo, plugin } from '../plugin'
import type { AllOutputTypes, GetGen, GetGen2 } from '../typegenTypeHelpers'
import { isPromiseLike, printedGenTyping } from '../utils'

export interface NullabilityPluginFallbackFn {
  ctx: GetGen<'context'>
  info: GraphQLResolveInfo
  type: GraphQLPossibleOutputs
}

export interface NullabilityPluginOnGuardedConfig {
  fallback: any
  ctx: GetGen<'context'>
  info: GraphQLResolveInfo
  type: GraphQLNullableType
}

export type NullFallbackValues = Partial<{
  [K in AllOutputTypes]: (obj: NullabilityPluginFallbackFn) => GetGen2<'rootTypes', K>
}>

export type NullabilityGuardConfig = {
  /** Whether we should guard against non-null values. Defaults to "true" if NODE_ENV === "production", false otherwise. */
  shouldGuard?: boolean
  /**
   * When a nullish value is "guarded", meaning it is coerced into an acceptable non-null value, this function
   * will be called if supplied.
   */
  onGuarded?: (obj: NullabilityPluginOnGuardedConfig) => void
  /** A mapping of typename to the value that should be used in the case of a null value. */
  fallbackValues?: NullFallbackValues
}

const fieldDefTypes = printedGenTyping({
  name: 'skipNullGuard',
  optional: true,
  type: 'boolean',
  description: `
    The nullability guard can be helpful, but is also a potentially expensive operation for lists.
    We need to iterate the entire list to check for null items to guard against. Set this to true
    to skip the null guard on a specific field if you know there's no potential for unsafe types.
  `,
})

export const nullabilityGuardPlugin = (pluginConfig: NullabilityGuardConfig) => {
  const {
    shouldGuard = process.env.NODE_ENV === 'production',
    fallbackValues = {},
    onGuarded = (obj: NullabilityPluginOnGuardedConfig) => {
      console.warn(`Nullability guard called for ${obj.info.parentType.name}.${obj.info.fieldName}`)
    },
  } = pluginConfig
  const finalPluginConfig: Required<NullabilityGuardConfig> = {
    shouldGuard,
    onGuarded,
    fallbackValues,
  }
  return plugin({
    name: 'NullabilityGuard',
    description: 'If we have a nullable field, we want to guard against this being an issue in production.',
    fieldDefTypes,
    onCreateFieldResolver(config: CreateFieldResolverInfo<{ skipNullGuard: boolean }>) {
      if (config.fieldConfig.extensions?.nexus?.config.skipNullGuard) {
        return
      }
      const { type } = config.fieldConfig
      const { outerNonNull, hasListNonNull } = nonNullInfo(type)
      if (outerNonNull || hasListNonNull) {
        return (root, args, ctx, info, next) => {
          return plugin.completeValue(
            next(root, args, ctx, info),
            nonNullGuard(
              ctx,
              info,
              isNonNullType(type) ? type.ofType : type,
              config,
              finalPluginConfig,
              outerNonNull
            )
          )
        }
      }
    },
    onAfterBuild(schema) {
      Object.keys(schema.getTypeMap()).forEach((typeName) => {
        const type = schema.getType(typeName) as NexusGraphQLNamedType
        if (isScalarType(type)) {
          if (fallbackValues[type.name as keyof typeof fallbackValues]) {
            return
          }
          console.error(
            `No nullability guard was provided for Scalar ${type.name}. ` +
              `Provide one in the nullabilityGuard config to remove this warning.`
          )
        }
      })
      if (pluginConfig.fallbackValues) {
        Object.keys(pluginConfig.fallbackValues).forEach((name) => {
          const type = schema.getType(name) as NexusGraphQLNamedType
          if (!type) {
            return console.error(`Unknown type ${name} provided in nullabilityGuard fallbackValues config.`)
          }
        })
      }
    },
  })
}

const isNullish = (val: any): boolean => val === null || val === undefined || val !== val

const nonNullGuard = (
  ctx: GetGen<'context'>,
  info: GraphQLResolveInfo,
  type: GraphQLOutputType,
  config: CreateFieldResolverInfo,
  pluginConfig: Required<NullabilityGuardConfig>,
  outerNonNull: boolean
) => {
  const { onGuarded, fallbackValues, shouldGuard } = pluginConfig
  const guardResult = (fallback: any) => {
    onGuarded({ ctx, info, type, fallback })
    return shouldGuard ? fallback : null
  }
  return (val: any) => {
    // If it's a list type, return [] if the value is null,
    // otherwise recurse into resolving the individual type.
    if (isListType(type)) {
      if (isNullish(val)) {
        return outerNonNull ? guardResult([]) : null
      }
      let hasPromise = false
      const listMembers: any[] = []
      const listCompleter = nonNullGuard(
        ctx,
        info,
        isNonNullType(type.ofType) ? type.ofType.ofType : type.ofType,
        config,
        pluginConfig,
        isNonNullType(type.ofType)
      )
      forEach(val as any, (item) => {
        if (!hasPromise && isPromiseLike(item)) {
          hasPromise = true
        }
        listMembers.push(plugin.completeValue(item, listCompleter))
      })
      return hasPromise ? Promise.all(listMembers) : listMembers
    }
    if (!isNullish(val) || outerNonNull === false) {
      return val
    }
    const typeName = type.name as keyof typeof fallbackValues
    const fallbackFn = fallbackValues[typeName]
    const fallbackValue = typeof fallbackFn === 'function' ? fallbackFn({ type, info, ctx }) : null

    if (!isNullish(fallbackValue)) {
      return guardResult(fallbackValue)
    }
    // If it's an object, just return an empty object and let the scalar fallbacks take care of the rest
    if (isObjectType(type)) {
      return guardResult({})
    }
    // If it's an enum, return the first member
    if (isEnumType(type)) {
      return guardResult(type.getValues()[0].value)
    }
    // If It's a union or interface, return the first type
    if (isUnionType(type) || isInterfaceType(type)) {
      const possibleTypes = info.schema.getPossibleTypes(type)
      return guardResult({ __typename: possibleTypes[0].name })
    }
    // Otherwise, fail?
    return val
  }
}

interface NonNullInfo {
  outerNonNull: boolean
  hasListNonNull: boolean
}

const nonNullInfo = (type: GraphQLOutputType): NonNullInfo => {
  let outerNonNull = false
  let hasListNonNull = false
  if (isNonNullType(type)) {
    outerNonNull = true
    type = type.ofType
  }
  while (isWrappingType(type)) {
    type = type.ofType
    if (isNonNullType(type)) {
      hasListNonNull = true
    }
  }
  return {
    outerNonNull,
    hasListNonNull,
  }
}
