import {
  GraphQLEnumType,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
  defaultTypeResolver,
} from 'graphql'
import type { MergeSchemaConfig } from './builder'
import { arg, ArgsRecord } from './definitions/args'
import type { InputDefinitionBlock } from './definitions/definitionBlocks'
import { enumType } from './definitions/enumType'
import { inputObjectType } from './definitions/inputObjectType'
import { InterfaceDefinitionBlock, interfaceType } from './definitions/interfaceType'
import { ObjectDefinitionBlock, objectType } from './definitions/objectType'
import { scalarType } from './definitions/scalarType'
import { unionType } from './definitions/unionType'
import { AllNexusArgsDefs, applyNexusWrapping, unwrapGraphQLDef } from './definitions/wrapping'
import type { Maybe, SourceTypingDef } from './definitions/_types'
import type { GetGen } from './typegenTypeHelpers'
import { graphql15InterfaceConfig, Unreachable } from './utils'

export interface RebuildConfig extends Omit<MergeSchemaConfig, 'schema'> {
  captureLeafType?: (type: GraphQLNamedType) => void
  asNexusMethod?: string
  sourceType?: SourceTypingDef
}

export function rebuildNamedType(type: GraphQLNamedType, config: RebuildConfig) {
  if (isObjectType(type)) {
    return rebuildObjectType(type, config)
  } else if (isInputObjectType(type)) {
    return rebuildInputObjectType(type, config)
  } else if (isInterfaceType(type)) {
    return rebuildInterfaceType(type, config)
  } else if (isUnionType(type)) {
    return rebuildUnionType(type, config)
  } else if (isScalarType(type)) {
    return rebuildScalarType(type, config)
  } else if (isEnumType(type)) {
    return rebuildEnumType(type, config)
  }
  throw new Unreachable(type)
}

export function rebuildInputObjectType(type: GraphQLInputObjectType, config: RebuildConfig) {
  const { name, fields, description, extensions } = type.toConfig()
  return inputObjectType({
    name,
    description,
    definition: (t) => {
      rebuildInputDefinition(name, t, fields, config)
    },
    extensions,
    nonNullDefaults: {
      output: false,
      input: false,
    },
  })
}

export function rebuildUnionType(type: GraphQLUnionType, config: RebuildConfig) {
  const { name, types, description, resolveType, extensions } = type.toConfig()
  return unionType({
    name,
    description,
    // @ts-ignore - todo, see why this is the case
    resolveType: resolveType ?? defaultTypeResolver,
    definition(t) {
      t.members(
        ...types.map((o) => {
          config.captureLeafType?.(o)
          return o.name as GetGen<'objectNames'>
        })
      )
    },
    extensions,
  })
}

export function rebuildScalarType(type: GraphQLScalarType, config: RebuildConfig) {
  return scalarType({
    ...type.toConfig(),
    sourceType: config.sourceType,
    asNexusMethod: config.asNexusMethod,
  })
}

export function rebuildEnumType(type: GraphQLEnumType, { sourceType, asNexusMethod }: RebuildConfig) {
  const { name, values, ...config } = type.toConfig()
  return enumType({
    name,
    ...config,
    members: Object.entries(values).map(([valueName, config]) => {
      return {
        name: valueName,
        deprecation: config.deprecationReason,
        ...config,
      }
    }),
    sourceType,
    asNexusMethod,
  })
}

export function rebuildInterfaceType(type: GraphQLInterfaceType, config: RebuildConfig) {
  const { name, fields, description, interfaces, extensions, resolveType } = graphql15InterfaceConfig(
    type.toConfig()
  )
  return interfaceType({
    name,
    description,
    // @ts-ignore - todo, see why this is the case
    resolveType: resolveType ?? defaultTypeResolver,
    definition: (t) => {
      rebuildOutputDefinition(name, t, fields, interfaces, config)
    },
    nonNullDefaults: {
      output: false,
      input: false,
    },
    extensions,
    sourceType: config.sourceType,
    asNexusMethod: config.asNexusMethod,
  })
}

export function rebuildObjectType(type: GraphQLObjectType, config: RebuildConfig) {
  const { name, fields, interfaces, description, extensions } = type.toConfig()
  return objectType({
    name,
    description,
    definition: (t) => {
      rebuildOutputDefinition(name, t, fields, interfaces, config)
    },
    nonNullDefaults: {
      output: false,
      input: false,
    },
    extensions,
    sourceType: config.sourceType,
    asNexusMethod: config.asNexusMethod,
  })
}

export function rebuildOutputDefinition(
  typeName: string,
  t: ObjectDefinitionBlock<string> | InterfaceDefinitionBlock<string>,
  fields: GraphQLFieldConfigMap<any, any>,
  interfaces: ReadonlyArray<GraphQLInterfaceType>,
  config: RebuildConfig
) {
  t.implements(
    ...interfaces.map((i) => {
      config.captureLeafType?.(i)
      return i.name as GetGen<'interfaceNames'>
    })
  )
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (config.skipFields?.[typeName] && config.skipFields?.[typeName].includes(fieldName)) {
      continue
    }
    const { namedType, wrapping } = unwrapGraphQLDef(fieldConfig.type)
    config.captureLeafType?.(namedType)
    t.field(fieldName, {
      type: applyNexusWrapping(namedType.name, wrapping),
      description: fieldConfig.description,
      deprecation: fieldConfig.deprecationReason,
      extensions: fieldConfig.extensions,
      args: rebuildArgs(typeName, fieldName, fieldConfig.args ?? {}, config),
      resolve: fieldConfig.resolve,
    })
  }
}

export function rebuildInputDefinition(
  typeName: string,
  t: InputDefinitionBlock<string>,
  fields: GraphQLInputFieldConfigMap,
  config: RebuildConfig
) {
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    if (config.skipFields?.[typeName] && config.skipFields?.[typeName].includes(fieldName)) {
      continue
    }
    const { namedType, wrapping } = unwrapGraphQLDef(fieldConfig.type)
    config.captureLeafType?.(namedType)
    t.field(fieldName, {
      type: applyNexusWrapping(namedType.name, wrapping),
      description: fieldConfig.description,
      default: fieldConfig.defaultValue,
      extensions: fieldConfig.extensions,
    })
  }
}

export function rebuildArgs(
  typeName: string,
  fieldName: string,
  argMap: Maybe<GraphQLFieldConfigArgumentMap>,
  config: RebuildConfig
): Maybe<ArgsRecord> {
  if (!argMap) {
    return null
  }
  const rebuiltArgs: Record<string, AllNexusArgsDefs> = {}
  for (const [argName, argConfig] of Object.entries(argMap)) {
    if (config.skipArgs?.[typeName]?.[fieldName]) {
      continue
    }
    const { namedType, wrapping } = unwrapGraphQLDef(argConfig.type)
    config.captureLeafType?.(namedType)
    rebuiltArgs[argName] = arg({
      type: applyNexusWrapping(namedType.name, wrapping),
      default: argConfig.defaultValue,
      description: argConfig.description,
      extensions: argConfig.extensions,
    })
  }
  return rebuiltArgs
}
