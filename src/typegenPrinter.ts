import {
  getNamedType,
  GraphQLAbstractType,
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLUnionType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isSpecifiedScalarType,
  isUnionType,
} from 'graphql'
import type { TypegenInfo } from './builder'
import { isNexusPrintedGenTyping, isNexusPrintedGenTypingImport } from './definitions/wrapping'
import type { NexusGraphQLSchema } from './definitions/_types'
import { TYPEGEN_HEADER } from './lang'
import type { StringLike } from './plugin'
import { hasNexusExtension } from './extensions'
import {
  eachObj,
  getOwnPackage,
  graphql15InterfaceType,
  GroupedTypes,
  groupTypes,
  mapObj,
  mapValues,
  PrintedGenTypingImport,
  relativePathTo,
  resolveImportPath,
} from './utils'

const SpecifiedScalars = {
  ID: 'string',
  String: 'string',
  Float: 'number',
  Int: 'number',
  Boolean: 'boolean',
}
type SpecifiedScalarNames = keyof typeof SpecifiedScalars

type TypeFieldMapping = Record<string, Record<string, [string, string]>>
type TypeMapping = Record<string, string>
type RootTypeMapping = Record<string, string | Record<string, [string, string]>>

interface TypegenInfoWithFile extends TypegenInfo {
  typegenPath: string
  globalsPath?: string
  globalsHeaders?: string[]
  declareInputs?: boolean
}

/**
 * We track and output a few main things:
 *
 * 1. "root" types, or the values that fill the first argument for a given object type 2. "arg" types, the
 * values that are arguments to output fields. 3. "return" types, the values returned from the resolvers...
 * usually just list/nullable variations on the
 *     "root" types for other types 4. The names of all types, grouped by type.
 *
 * - Non-scalar types will get a dedicated "Root" type associated with it
 */
export class TypegenPrinter {
  private groupedTypes: GroupedTypes
  private printImports: Record<string, Record<string, boolean | string>>
  private hasDiscriminatedTypes: boolean

  constructor(protected schema: NexusGraphQLSchema, protected typegenInfo: TypegenInfoWithFile) {
    this.groupedTypes = groupTypes(schema)
    this.printImports = {}
    this.hasDiscriminatedTypes = false
  }

  print() {
    const body = [this.printCommon(), this.printPlugins()].join('\n\n')
    return [this.printHeaders(), body].join('\n\n')
  }

  printConfigured() {
    if (this.typegenInfo.globalsPath) {
      const plugins = this.printPlugins()
      const globalTypes = [this.printHeadersGlobal(), this.printDynamicImport(true), plugins].join('\n\n')

      // Reset printImports for the imports needed in the types
      this.printImports = {}

      const common = this.printCommon()
      const tsTypes = [this.printHeadersCommon(), common].join('\n\n')
      return {
        tsTypes,
        globalTypes,
      }
    }
    return {
      tsTypes: this.print(),
      globalTypes: null,
    }
  }

  private printCommon() {
    return [
      this.printInputTypeMap(),
      this.printEnumTypeMap(),
      this.printScalarTypeMap(),
      this.printObjectTypeMap(),
      this.printInterfaceTypeMap(),
      this.printUnionTypeMap(),
      this.printRootTypeDef(),
      this.printAllTypesMap(),
      this.printFieldTypesMap(),
      this.printFieldTypeNamesMap(),
      this.printArgTypeMap(),
      this.printAbstractTypeMembers(),
      this.printInheritedFieldMap(),
      this.printTypeNames('object', 'NexusGenObjectNames', 'NexusGenObjects'),
      this.printTypeNames('input', 'NexusGenInputNames', 'NexusGenInputs'),
      this.printTypeNames('enum', 'NexusGenEnumNames', 'NexusGenEnums'),
      this.printTypeNames('interface', 'NexusGenInterfaceNames', 'NexusGenInterfaces'),
      this.printTypeNames('scalar', 'NexusGenScalarNames', 'NexusGenScalars'),
      this.printTypeNames('union', 'NexusGenUnionNames', 'NexusGenUnions'),
      this.printIsTypeOfObjectTypeNames('NexusGenObjectsUsingAbstractStrategyIsTypeOf'),
      this.printResolveTypeAbstractTypes('NexusGenAbstractsUsingStrategyResolveType'),
      this.printFeaturesConfig('NexusGenFeaturesConfig'),
      this.printGenTypeMap(),
    ].join('\n\n')
  }

  private printHeaders() {
    return [this.printHeadersCommon(), this.printHeadersGlobal()].join('\n')
  }

  private printHeadersCommon() {
    return [
      this.typegenInfo.headers.join('\n'),
      this.typegenInfo.imports.join('\n'),
      this.printDynamicImport(),
    ].join('\n')
  }

  private printHeadersGlobal() {
    const headers = [
      this.printDynamicInputFieldDefinitions(),
      this.printDynamicOutputFieldDefinitions(),
      this.printDynamicOutputPropertyDefinitions(),
      GLOBAL_DECLARATION,
    ]

    if (this.typegenInfo.globalsPath) {
      headers.unshift(
        `import type { NexusGenTypes } from '${relativePathTo(
          this.typegenInfo.typegenPath,
          this.typegenInfo.globalsPath ?? ''
        )}'`
      )
      headers.unshift(...(this.typegenInfo.globalsHeaders ?? []))
      headers.unshift(TYPEGEN_HEADER)
    }

    return headers.join('\n')
  }

  private printGenTypeMap() {
    return [`export interface NexusGenTypes {`]
      .concat([
        `  context: ${this.printContext()};`,
        `  inputTypes: NexusGenInputs;`,
        `  rootTypes: NexusGenRootTypes;`,
        `  inputTypeShapes: NexusGenInputs & NexusGenEnums & NexusGenScalars;`,
        `  argTypes: NexusGenArgTypes;`,
        `  fieldTypes: NexusGenFieldTypes;`,
        `  fieldTypeNames: NexusGenFieldTypeNames;`,
        `  allTypes: NexusGenAllTypes;`,
        `  typeInterfaces: NexusGenTypeInterfaces;`,
        `  objectNames: NexusGenObjectNames;`,
        `  inputNames: NexusGenInputNames;`,
        `  enumNames: NexusGenEnumNames;`,
        `  interfaceNames: NexusGenInterfaceNames;`,
        `  scalarNames: NexusGenScalarNames;`,
        `  unionNames: NexusGenUnionNames;`,
        `  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];`,
        `  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];`,
        `  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']`,
        `  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];`,
        `  abstractTypeMembers: NexusGenAbstractTypeMembers;`,
        `  objectsUsingAbstractStrategyIsTypeOf: NexusGenObjectsUsingAbstractStrategyIsTypeOf;`,
        `  abstractsUsingStrategyResolveType: NexusGenAbstractsUsingStrategyResolveType;`,
        `  features: NexusGenFeaturesConfig;`,
      ])
      .concat('}')
      .join('\n')
  }

  private printDynamicImport(forGlobal = false) {
    const { sourceTypings } = this.schema.extensions.nexus.config
    const { contextTypeImport } = this.typegenInfo
    const imports: string[] = []
    const importMap: Record<string, Set<string>> = {}
    const outputPath = this.typegenInfo.typegenPath
    const nexusSchemaImportId = this.typegenInfo.nexusSchemaImportId ?? getOwnPackage().name

    if (!this.printImports[nexusSchemaImportId]) {
      this.maybeAddCoreImport(forGlobal)
    }

    if (!forGlobal) {
      if (contextTypeImport) {
        const importPath = resolveImportPath(contextTypeImport, 'context', outputPath)
        importMap[importPath] = importMap[importPath] || new Set()
        importMap[importPath].add(
          contextTypeImport.alias
            ? `${contextTypeImport.export} as ${contextTypeImport.alias}`
            : contextTypeImport.export
        )
      }
      eachObj(sourceTypings, (rootType, typeName) => {
        if (typeof rootType !== 'string') {
          const importPath = resolveImportPath(rootType, typeName, outputPath)
          importMap[importPath] = importMap[importPath] || new Set()
          importMap[importPath].add(
            rootType.alias ? `${rootType.export} as ${rootType.alias}` : rootType.export
          )
        }
      })
      eachObj(importMap, (val, key) => {
        imports.push(`import type { ${Array.from(val).join(', ')} } from ${JSON.stringify(key)}`)
      })
    }

    eachObj(this.printImports, (val, key) => {
      const { default: def, ...rest } = val
      const idents = []
      if (def) {
        idents.push(def)
      }
      let bindings: string[] = []
      eachObj(rest, (alias, binding) => {
        bindings.push(alias !== true ? `${binding} as ${alias}` : `${binding}`)
      })
      if (bindings.length) {
        idents.push(`{ ${bindings.join(', ')} }`)
      }
      imports.push(`import type ${idents.join(', ')} from ${JSON.stringify(key)}`)
    })
    return imports.join('\n')
  }

  private maybeAddCoreImport(forGlobal = false) {
    const nexusSchemaImportId = this.typegenInfo.nexusSchemaImportId ?? getOwnPackage().name
    const {
      dynamicFields: { dynamicInputFields, dynamicOutputFields },
    } = this.schema.extensions.nexus.config

    let shouldAdd = false
    const hasDynamicFields = [dynamicInputFields, dynamicOutputFields].some((o) => Object.keys(o).length > 0)

    if (!this.typegenInfo.globalsPath) {
      shouldAdd = hasDynamicFields || this.hasDiscriminatedTypes
    } else {
      shouldAdd = forGlobal ? hasDynamicFields : this.hasDiscriminatedTypes
    }

    if (shouldAdd) {
      this.printImports[nexusSchemaImportId] = {
        core: true,
      }
    }
  }

  private printDynamicInputFieldDefinitions() {
    const { dynamicInputFields } = this.schema.extensions.nexus.config.dynamicFields
    // If there is nothing custom... exit
    if (!Object.keys(dynamicInputFields).length) {
      return []
    }
    return [`declare global {`, `  interface NexusGenCustomInputMethods<TypeName extends string> {`]
      .concat(
        mapObj(dynamicInputFields, (val, key) => {
          if (typeof val === 'string') {
            const baseType = this.schema.getType(val)
            return this.prependDoc(
              `    ${key}<FieldName extends string>(fieldName: FieldName, opts?: core.CommonInputFieldConfig<TypeName, FieldName>): void // ${JSON.stringify(
                val
              )};`,
              baseType?.description
            )
          }
          return this.prependDoc(
            `    ${key}${val.value.typeDefinition || `(...args: any): void`}`,
            val.value.typeDescription
          )
        })
      )
      .concat([`  }`, `}`])
      .join('\n')
  }

  private printDynamicOutputFieldDefinitions() {
    const { dynamicOutputFields } = this.schema.extensions.nexus.config.dynamicFields
    // If there is nothing custom... exit
    if (!Object.keys(dynamicOutputFields).length) {
      return []
    }
    return [`declare global {`, `  interface NexusGenCustomOutputMethods<TypeName extends string> {`]
      .concat(
        mapObj(dynamicOutputFields, (val, key) => {
          if (typeof val === 'string') {
            const baseType = this.schema.getType(val)
            return this.prependDoc(
              `    ${key}<FieldName extends string>(fieldName: FieldName, ...opts: core.ScalarOutSpread<TypeName, FieldName>): void // ${JSON.stringify(
                val
              )};`,
              baseType?.description
            )
          }
          return this.prependDoc(
            `    ${key}${val.value.typeDefinition || `(...args: any): void`}`,
            val.value.typeDescription
          )
        })
      )
      .concat([`  }`, `}`])
      .join('\n')
  }

  private prependDoc(typeDef: string, typeDescription?: string | null) {
    let outStr = ''
    if (typeDescription) {
      let parts = typeDescription.split('\n').map((f) => f.trimLeft())
      if (parts[0] === '') {
        parts = parts.slice(1)
      }
      if (parts[parts.length - 1] === '') {
        parts = parts.slice(0, -1)
      }
      outStr = ['    /**', ...parts.map((p) => `     *${p ? ` ${p}` : ''}`), '     */'].join('\n') + '\n'
    }
    return `${outStr}${typeDef}`
  }

  private printDynamicOutputPropertyDefinitions() {
    const { dynamicOutputProperties } = this.schema.extensions.nexus.config.dynamicFields
    // If there is nothing custom... exit
    if (!Object.keys(dynamicOutputProperties).length) {
      return []
    }
    return [`declare global {`, `  interface NexusGenCustomOutputProperties<TypeName extends string> {`]
      .concat(
        mapObj(dynamicOutputProperties, (val, key) => {
          return this.prependDoc(
            `    ${key}${val.value.typeDefinition || `: any`}`,
            val.value.typeDescription
          )
        })
      )
      .concat([`  }`, `}`])
      .join('\n')
  }

  private printInheritedFieldMap() {
    const hasInterfaces: (
      | (GraphQLInterfaceType & { getInterfaces(): ReadonlyArray<GraphQLInterfaceType> })
      | GraphQLObjectType
    )[] = []
    const withInterfaces = hasInterfaces
      .concat(this.groupedTypes.object, this.groupedTypes.interface.map(graphql15InterfaceType))
      .map((o) => {
        if (o.getInterfaces().length) {
          return [o.name, o.getInterfaces().map((i) => i.name)]
        }
        return null
      })
      .filter((f) => f) as [string, string[]][]

    return ['export interface NexusGenTypeInterfaces {']
      .concat(
        withInterfaces.map(([name, interfaces]) => {
          return `  ${name}: ${interfaces.map((i) => JSON.stringify(i)).join(' | ')}`
        })
      )
      .concat('}')
      .join('\n')
  }

  private printContext() {
    return this.typegenInfo.contextTypeImport?.alias || this.typegenInfo.contextTypeImport?.export || 'any'
  }

  private printAbstractTypeMembers() {
    return this.printTypeInterface('NexusGenAbstractTypeMembers', this.buildAbstractTypeMembers())
  }

  private buildAbstractTypeMembers() {
    const sourceMap: TypeMapping = {}
    const abstractTypes: (GraphQLInterfaceType | GraphQLUnionType)[] = []
    abstractTypes
      .concat(this.groupedTypes.union)
      .concat(this.groupedTypes.interface)
      .forEach((type) => {
        if (isInterfaceType(type)) {
          const possibleNames = this.schema.getPossibleTypes(type).map((t) => t.name)
          if (possibleNames.length > 0) {
            sourceMap[type.name] = possibleNames.map((val) => JSON.stringify(val)).join(' | ')
          }
        } else {
          sourceMap[type.name] = type
            .getTypes()
            .map((t) => JSON.stringify(t.name))
            .join(' | ')
        }
      })
    return sourceMap
  }

  private printTypeNames(name: keyof GroupedTypes, exportName: string, source: string) {
    const obj = this.groupedTypes[name] as GraphQLNamedType[]
    const typeDef = obj.length === 0 ? 'never' : `keyof ${source}`
    return `export type ${exportName} = ${typeDef};`
  }

  private printIsTypeOfObjectTypeNames(exportName: string) {
    const objectTypes = this.groupedTypes.object.filter((o) => o.isTypeOf !== undefined)
    const typeDef =
      objectTypes.length === 0
        ? 'never'
        : objectTypes
            .map((o) => JSON.stringify(o.name))
            .sort()
            .join(' | ')
    return `export type ${exportName} = ${typeDef};`
  }

  private printResolveTypeAbstractTypes(exportName: string) {
    const abstractTypes = [...this.groupedTypes.interface, ...this.groupedTypes.union].filter(
      (o) => o.resolveType !== undefined
    )
    const typeDef =
      abstractTypes.length === 0
        ? 'never'
        : abstractTypes

            .map((o) => JSON.stringify(o.name))
            .sort()
            .join(' | ')
    return `export type ${exportName} = ${typeDef};`
  }

  private printFeaturesConfig(exportName: string) {
    const abstractTypes = this.schema.extensions.nexus.config.features?.abstractTypeStrategies ?? {}
    const unionProps = renderObject(mapValues(abstractTypes, (val) => val ?? false))

    return [`export type ${exportName} = {`]
      .concat(`  abstractTypeStrategies: ${unionProps}`)
      .concat('}')
      .join('\n')
  }

  private buildEnumTypeMap() {
    const enumMap: TypeMapping = {}
    this.groupedTypes.enum.forEach((e) => {
      const sourceType = this.resolveSourceType(e.name)
      if (sourceType) {
        enumMap[e.name] = sourceType
      } else {
        const values = e.getValues().map((val) => JSON.stringify(val.value))
        enumMap[e.name] = values.join(' | ')
      }
    })
    return enumMap
  }

  private buildInputTypeMap() {
    const inputObjMap: TypeFieldMapping = {}
    this.groupedTypes.input.forEach((input) => {
      eachObj(input.getFields(), (field) => {
        inputObjMap[input.name] = inputObjMap[input.name] || {}
        inputObjMap[input.name][field.name] = this.normalizeArg(field)
      })
    })
    return inputObjMap
  }

  private buildScalarTypeMap() {
    const scalarMap: TypeMapping = {}
    this.groupedTypes.scalar.forEach((e) => {
      if (isSpecifiedScalarType(e)) {
        scalarMap[e.name] = this.resolveSourceType(e.name) ?? SpecifiedScalars[e.name as SpecifiedScalarNames]
        return
      }
      const sourceType = this.resolveSourceType(e.name)
      if (sourceType) {
        scalarMap[e.name] = sourceType
      } else {
        scalarMap[e.name] = 'any'
      }
    })
    return scalarMap
  }

  private printInputTypeMap() {
    const inputTypeMap = this.buildInputTypeMap()

    if (this.typegenInfo.declareInputs) {
      const declaredInputs: string[] = mapObj(inputTypeMap, (fields, inputName) =>
        this.printNamedObj(inputName, fields)
      )
      return [...declaredInputs, this.printNamedMap('NexusGenInputs', inputTypeMap)].join('\n\n')
    }

    return this.printTypeFieldInterface('NexusGenInputs', inputTypeMap, 'input type')
  }

  private printEnumTypeMap() {
    const enumTypeMap = this.buildEnumTypeMap()

    if (this.typegenInfo.declareInputs) {
      return [
        ...mapObj(enumTypeMap, (val, name) => `export type ${name} = ${val}`),
        this.printNamedMap('NexusGenEnums', enumTypeMap),
      ].join('\n\n')
    }

    return this.printTypeInterface('NexusGenEnums', enumTypeMap)
  }

  private printScalarTypeMap() {
    return this.printTypeInterface('NexusGenScalars', this.buildScalarTypeMap())
  }

  private shouldDiscriminateType(
    abstractType: GraphQLAbstractType,
    objectType: GraphQLObjectType
  ): 'required' | 'optional' | false {
    if (!this.schema.extensions.nexus.config.features?.abstractTypeStrategies?.__typename) {
      return false
    }

    if (abstractType.resolveType !== undefined) {
      return 'optional'
    }

    if (objectType.isTypeOf !== undefined) {
      return 'optional'
    }

    return 'required'
  }

  private maybeDiscriminate(abstractType: GraphQLAbstractType, objectType: GraphQLObjectType) {
    const requiredOrOptional = this.shouldDiscriminateType(abstractType, objectType)

    if (requiredOrOptional === false) {
      return `NexusGenRootTypes['${objectType.name}']`
    }

    this.hasDiscriminatedTypes = true

    return `core.Discriminate<'${objectType.name}', '${requiredOrOptional}'>`
  }

  private buildRootTypeMap(hasFields: Array<GraphQLInterfaceType | GraphQLObjectType | GraphQLUnionType>) {
    const rootTypeMap: RootTypeMapping = {}
    hasFields.forEach((type) => {
      const rootTyping = this.resolveSourceType(type.name)
      if (rootTyping) {
        rootTypeMap[type.name] = rootTyping
        return
      }
      if (isUnionType(type)) {
        rootTypeMap[type.name] = type
          .getTypes()
          .map((t) => this.maybeDiscriminate(type, t))
          .join(' | ')
      } else if (isInterfaceType(type)) {
        const possibleRoots = this.schema.getPossibleTypes(type).map((t) => this.maybeDiscriminate(type, t))
        if (possibleRoots.length > 0) {
          rootTypeMap[type.name] = possibleRoots.join(' | ')
        } else {
          rootTypeMap[type.name] = 'any'
        }
      } else if (type.name === 'Query' || type.name === 'Mutation') {
        rootTypeMap[type.name] = '{}'
      } else {
        eachObj(type.getFields(), (field) => {
          const obj = (rootTypeMap[type.name] = rootTypeMap[type.name] || {})
          if (!this.hasResolver(field, type)) {
            if (typeof obj !== 'string') {
              obj[field.name] = [
                this.argSeparator(field.type as GraphQLInputType, false),
                this.printOutputType(field.type),
              ]
            }
          }
        })
      }
    })
    return rootTypeMap
  }

  private resolveSourceType(typeName: string): string | undefined {
    const rootTyping = this.schema.extensions.nexus.config.sourceTypings[typeName]
    if (rootTyping) {
      return typeof rootTyping === 'string' ? rootTyping : rootTyping.export
    }
    return (this.typegenInfo.sourceTypeMap as any)[typeName]
  }

  private hasResolver(
    field: GraphQLField<any, any>,
    // Used in test mocking
    _type: GraphQLObjectType
  ) {
    if (field.extensions && hasNexusExtension(field.extensions.nexus)) {
      return field.extensions.nexus.hasDefinedResolver
    }
    return Boolean(field.resolve)
  }

  private printObjectTypeMap() {
    return this.printRootTypeFieldInterface(
      'NexusGenObjects',
      this.buildRootTypeMap(this.groupedTypes.object)
    )
  }

  private printInterfaceTypeMap() {
    return this.printRootTypeFieldInterface(
      'NexusGenInterfaces',
      this.buildRootTypeMap(this.groupedTypes.interface)
    )
  }

  private printUnionTypeMap() {
    return this.printRootTypeFieldInterface('NexusGenUnions', this.buildRootTypeMap(this.groupedTypes.union))
  }

  private printRootTypeDef() {
    const toJoin: string[] = []
    if (this.groupedTypes.interface.length) {
      toJoin.push('NexusGenInterfaces')
    }
    if (this.groupedTypes.object.length) {
      toJoin.push('NexusGenObjects')
    }
    if (this.groupedTypes.union.length) {
      toJoin.push('NexusGenUnions')
    }
    return `export type NexusGenRootTypes = ${toJoin.join(' & ')}`
  }

  private printAllTypesMap() {
    const toJoin: string[] = ['NexusGenRootTypes']
    if (this.groupedTypes.scalar.length) {
      toJoin.push('NexusGenScalars')
    }
    if (this.groupedTypes.enum.length) {
      toJoin.push('NexusGenEnums')
    }
    return `export type NexusGenAllTypes = ${toJoin.join(' & ')}`
  }

  private buildArgTypeMap() {
    const argTypeMap: Record<string, TypeFieldMapping> = {}
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = []
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
      .forEach((type) => {
        eachObj(type.getFields(), (field) => {
          if (field.args.length > 0) {
            argTypeMap[type.name] = argTypeMap[type.name] || {}
            argTypeMap[type.name][field.name] = field.args.reduce((obj, arg) => {
              obj[arg.name] = this.normalizeArg(arg)
              return obj
            }, {} as Record<string, [string, string]>)
          }
        })
      })
    return argTypeMap
  }

  private printArgTypeMap() {
    const argTypeMap = this.buildArgTypeMap()
    if (this.typegenInfo.declareInputs) {
      const declaredArgs: string[] = []
      eachObj(argTypeMap, (fields, typeName) => {
        eachObj(fields, (args, fieldName) => {
          declaredArgs.push(this.printNamedObj(this.getArgsName(typeName, fieldName), args))
        })
      })
      return [...declaredArgs, this.printArgTypeFieldInterface(argTypeMap)].join('\n\n')
    }

    return this.printArgTypeFieldInterface(argTypeMap)
  }

  private getArgsName(typeName: string, fieldName: string) {
    return `${typeName}${fieldName.slice(0, 1).toUpperCase().concat(fieldName.slice(1))}Args`
  }

  private printNamedObj(name: string, obj: Record<string, [string, string]>) {
    return [
      `export interface ${name} {`,
      ...mapObj(obj, (val, key) => `  ${key}${val[0]} ${val[1]}`),
      `}`,
    ].join('\n')
  }

  private printNamedMap(name: string, obj: Record<string, any>) {
    return [`export interface ${name} {`, ...mapObj(obj, (val, key) => `  ${key}: ${key}`), `}`].join('\n')
  }

  private buildReturnTypeMap() {
    const returnTypeMap: TypeFieldMapping = {}
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = []
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
      .forEach((type) => {
        eachObj(type.getFields(), (field) => {
          returnTypeMap[type.name] = returnTypeMap[type.name] || {}
          returnTypeMap[type.name][field.name] = [':', this.printOutputType(field.type)]
        })
      })
    return returnTypeMap
  }

  private buildReturnTypeNamesMap() {
    const returnTypeMap: TypeFieldMapping = {}
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = []
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
      .forEach((type) => {
        eachObj(type.getFields(), (field) => {
          returnTypeMap[type.name] = returnTypeMap[type.name] || {}
          returnTypeMap[type.name][field.name] = [':', `'${getNamedType(field.type).name}'`]
        })
      })
    return returnTypeMap
  }

  private printOutputType(type: GraphQLOutputType) {
    const returnType = this.typeToArr(type)
    function combine(item: any[]): string {
      if (item.length === 1) {
        if (Array.isArray(item[0])) {
          const toPrint = combine(item[0])
          return toPrint.indexOf('null') === -1 ? `${toPrint}[]` : `Array<${toPrint}>`
        }
        return item[0]
      }
      if (Array.isArray(item[1])) {
        const toPrint = combine(item[1])
        return toPrint.indexOf('null') === -1 ? `${toPrint}[] | null` : `Array<${toPrint}> | null`
      }
      return `${item[1]} | null`
    }
    return `${combine(returnType)}; // ${type}`
  }

  private typeToArr(type: GraphQLOutputType): any[] {
    const typing = []
    if (isNonNullType(type)) {
      type = type.ofType
    } else {
      typing.push(null)
    }
    if (isListType(type)) {
      typing.push(this.typeToArr(type.ofType))
    } else if (isScalarType(type)) {
      typing.push(this.printScalar(type))
    } else if (isEnumType(type)) {
      if (this.typegenInfo.declareInputs) {
        typing.push(type.name)
      } else {
        typing.push(`NexusGenEnums['${type.name}']`)
      }
    } else if (isObjectType(type) || isInterfaceType(type) || isUnionType(type)) {
      typing.push(`NexusGenRootTypes['${type.name}']`)
    }
    return typing
  }

  private printFieldTypesMap() {
    return this.printTypeFieldInterface('NexusGenFieldTypes', this.buildReturnTypeMap(), 'field return type')
  }

  private printFieldTypeNamesMap() {
    return this.printTypeFieldInterface(
      'NexusGenFieldTypeNames',
      this.buildReturnTypeNamesMap(),
      'field return type name'
    )
  }

  private normalizeArg(arg: GraphQLInputField | GraphQLArgument): [string, string] {
    return [this.argSeparator(arg.type, Boolean(arg.defaultValue)), this.argTypeRepresentation(arg.type)]
  }

  private argSeparator(type: GraphQLInputType, hasDefaultValue: boolean) {
    if (hasDefaultValue || isNonNullType(type)) {
      return ':'
    }

    return '?:'
  }

  private argTypeRepresentation(arg: GraphQLInputType): string {
    const argType = this.argTypeArr(arg)
    function combine(item: any[]): string {
      if (item.length === 1) {
        if (Array.isArray(item[0])) {
          const toPrint = combine(item[0])
          return toPrint.indexOf('null') === -1 ? `${toPrint}[]` : `Array<${toPrint}>`
        }
        return item[0]
      }
      if (Array.isArray(item[1])) {
        const toPrint = combine(item[1])
        return toPrint.indexOf('null') === -1 ? `${toPrint}[] | null` : `Array<${toPrint}> | null`
      }
      return `${item[1]} | null`
    }
    return `${combine(argType)}; // ${arg}`
  }

  private argTypeArr(arg: GraphQLInputType): any[] {
    const typing = []
    if (isNonNullType(arg)) {
      arg = arg.ofType
    } else {
      typing.push(null)
    }
    if (isListType(arg)) {
      typing.push(this.argTypeArr(arg.ofType))
    } else if (isScalarType(arg)) {
      typing.push(this.printScalar(arg))
    } else if (isEnumType(arg)) {
      if (this.typegenInfo.declareInputs) {
        typing.push(arg.name)
      } else {
        typing.push(`NexusGenEnums['${arg.name}']`)
      }
    } else if (isInputObjectType(arg)) {
      if (this.typegenInfo.declareInputs) {
        typing.push(arg.name)
      } else {
        typing.push(`NexusGenInputs['${arg.name}']`)
      }
    }
    return typing
  }

  private printTypeInterface(interfaceName: string, typeMapping: TypeMapping) {
    return [`export interface ${interfaceName} {`]
      .concat(mapObj(typeMapping, (val, key) => `  ${key}: ${val}`))
      .concat('}')
      .join('\n')
  }

  private printRootTypeFieldInterface(interfaceName: string, typeMapping: RootTypeMapping) {
    return [`export interface ${interfaceName} {`]
      .concat(
        mapObj(typeMapping, (val, key) => {
          if (typeof val === 'string') {
            return `  ${key}: ${val};`
          }
          if (Object.keys(val).length === 0) {
            return `  ${key}: {};`
          }
          return this.printObj('  ', 'root type')(val, key)
        })
      )
      .concat('}')
      .join('\n')
  }

  private printTypeFieldInterface(interfaceName: string, typeMapping: TypeFieldMapping, source: string) {
    return [`export interface ${interfaceName} {`]
      .concat(mapObj(typeMapping, this.printObj('  ', source)))
      .concat('}')
      .join('\n')
  }

  private printArgTypeFieldInterface(typeMapping: Record<string, TypeFieldMapping>) {
    return [`export interface NexusGenArgTypes {`]
      .concat(
        mapObj(typeMapping, (val, typeName) => {
          if (this.typegenInfo.declareInputs) {
            return [`  ${typeName}: {`]
              .concat(
                mapObj(val, (_, fieldName) => `    ${fieldName}: ${this.getArgsName(typeName, fieldName)}`)
              )
              .concat('  }')
              .join('\n')
          }
          return [`  ${typeName}: {`]
            .concat(mapObj(val, this.printObj('    ', 'args')))
            .concat('  }')
            .join('\n')
        })
      )
      .concat('}')
      .join('\n')
  }

  private printObj =
    (space: string, source: string) => (val: Record<string, [string, string]>, key: string) => {
      return [`${space}${key}: { // ${source}`]
        .concat(
          mapObj(val, (v2, k2) => {
            return `${space}  ${k2}${v2[0]} ${v2[1]}`
          })
        )
        .concat(`${space}}`)
        .join('\n')
    }

  private printScalar(type: GraphQLScalarType) {
    if (isSpecifiedScalarType(type)) {
      return this.resolveSourceType(type.name) ?? SpecifiedScalars[type.name as SpecifiedScalarNames]
    }
    return `NexusGenScalars['${type.name}']`
  }

  private printPlugins() {
    const pluginFieldExt: string[] = [
      `  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {`,
    ]
    const pluginInputFieldExt: string[] = [
      `  interface NexusGenPluginInputFieldConfig<TypeName extends string, FieldName extends string> {`,
    ]
    const pluginArgExt: string[] = [`  interface NexusGenPluginArgConfig {`]
    const pluginSchemaExt: string[] = [`  interface NexusGenPluginSchemaConfig {`]
    const pluginTypeExt: string[] = [`  interface NexusGenPluginTypeConfig<TypeName extends string> {`]
    const pluginInputTypeExt: string[] = [
      `  interface NexusGenPluginInputTypeConfig<TypeName extends string> {`,
    ]
    const printInlineDefs: string[] = []
    const plugins = this.schema.extensions.nexus.config.plugins || []
    plugins.forEach((plugin) => {
      if (plugin.config.fieldDefTypes) {
        pluginFieldExt.push(padLeft(this.printType(plugin.config.fieldDefTypes), '    '))
      }
      if (plugin.config.inputFieldDefTypes) {
        pluginInputFieldExt.push(padLeft(this.printType(plugin.config.inputFieldDefTypes), '    '))
      }
      if (plugin.config.objectTypeDefTypes) {
        pluginTypeExt.push(padLeft(this.printType(plugin.config.objectTypeDefTypes), '    '))
      }
      if (plugin.config.inputObjectTypeDefTypes) {
        pluginInputTypeExt.push(padLeft(this.printType(plugin.config.inputObjectTypeDefTypes), '    '))
      }
      if (plugin.config.argTypeDefTypes) {
        pluginArgExt.push(padLeft(this.printType(plugin.config.argTypeDefTypes), '    '))
      }
    })
    return [
      printInlineDefs.join('\n'),
      [
        'declare global {',
        [
          pluginTypeExt.concat('  }').join('\n'),
          pluginInputTypeExt.concat('  }').join('\n'),
          pluginFieldExt.concat('  }').join('\n'),
          pluginInputFieldExt.concat('  }').join('\n'),
          pluginSchemaExt.concat('  }').join('\n'),
          pluginArgExt.concat('  }').join('\n'),
        ].join('\n'),
        '}',
      ].join('\n'),
    ].join('\n')
  }

  private printType(strLike: StringLike | StringLike[]): string {
    if (Array.isArray(strLike)) {
      return strLike.map((s) => this.printType(s)).join('\n')
    }
    if (isNexusPrintedGenTyping(strLike)) {
      strLike.imports.forEach((i) => {
        this.addImport(i)
      })
      return strLike.toString()
    }
    if (isNexusPrintedGenTypingImport(strLike)) {
      this.addImport(strLike)
      return ''
    }
    return strLike
  }

  private addImport(i: PrintedGenTypingImport) {
    /* istanbul ignore if */
    if (!isNexusPrintedGenTypingImport(i)) {
      console.warn(`Expected printedGenTypingImport, saw ${i}`)
      return
    }
    this.printImports[i.config.module] = this.printImports[i.config.module] || {}
    if (i.config.default) {
      this.printImports[i.config.module].default = i.config.default
    }
    if (i.config.bindings) {
      i.config.bindings.forEach((binding) => {
        if (typeof binding === 'string') {
          this.printImports[i.config.module][binding] = true
        } else {
          this.printImports[i.config.module][binding[0]] = binding[1]
        }
      })
    }
  }
}

function padLeft(str: string, padding: string) {
  return str
    .split('\n')
    .map((s) => `${padding}${s}`)
    .join('\n')
}

const GLOBAL_DECLARATION = `
declare global {
  interface NexusGen extends NexusGenTypes {}
}`

function renderObject(object: Record<string, any>): string {
  return [
    '{',
    mapObj(object, (val, key) => {
      return `    ${key}: ${val}`
    }).join('\n'),
    '  }',
  ].join('\n')
}
