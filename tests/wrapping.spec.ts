import { isNexusTypeDef, normalizeArgWrapping, finalizeWrapping } from '../src/definitions/wrapping'
import { nonNull } from '../src/definitions/nonNull'
import { stringArg, NexusArgDef } from '../src/definitions/args'
import { list } from '../src/definitions/list'
import { GraphQLString, GraphQLList } from 'graphql'

describe('wrapping', () => {
  test('isNexusTypeDef should warn about being deprecated', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementationOnce(() => {})
    isNexusTypeDef({})
    expect(spy).toHaveBeenCalledWith('isNexusTypeDef is deprecated, use isNexusStruct')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  describe('normalizeArgWrapping', () => {
    it('should retain description & other info on the arg', () => {
      const x = normalizeArgWrapping(nonNull(list(stringArg({ description: 'Some Description' }))))
      expect(x.value.description).toEqual('Some Description')
    })

    it('should wrap if the type is a string', () => {
      const x = normalizeArgWrapping(nonNull(list('String')))
      expect(x).toBeInstanceOf(NexusArgDef)
    })

    it('should wrap if the type is a GraphQL type', () => {
      const x = normalizeArgWrapping(nonNull(list(GraphQLList(GraphQLString))))
      expect(x).toBeInstanceOf(NexusArgDef)
    })
  })

  describe('finalizeWrapping', () => {
    it('adds nonNull around unguarded elements when nonNullDefaults = true', () => {
      const input = ['List', 'List', 'Null', 'List'] as const
      const output = ['NonNull', 'List', 'NonNull', 'List', 'List', 'NonNull'] as const
      expect(finalizeWrapping(true, input)).toEqual(output)
    })
    it('does not add nonNull around elements when nonNullDefaults = false', () => {
      const input = ['List', 'List', 'List'] as const
      const output = ['List', 'List', 'List'] as const
      expect(finalizeWrapping(false, input)).toEqual(output)
    })

    it('does not add nonNull around elements when nonNullDefaults = false', () => {
      const input = ['List', 'List', 'NonNull', 'List'] as const
      const output = ['List', 'List', 'NonNull', 'List'] as const
      expect(finalizeWrapping(false, input)).toEqual(output)
    })
  })
})
