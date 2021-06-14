import { generateSchema, interfaceType, objectType } from '../../src/core'

describe('modify', () => {
  describe('interfaces implementing interfaces', () => {
    let schemaTypes: string
    beforeAll(async () => {
      // Example schema courtesy of ivan explaining interfaces implementing interfaces to me
      ;({ schemaTypes } = await generateSchema.withArtifacts({
        types: [
          interfaceType({
            name: 'Pet',
            definition(t) {
              t.field('mother', { type: 'Pet' })
            },
          }),
          interfaceType({
            name: 'Equine',
            definition(t) {
              t.implements('Pet')
              t.modify('mother', { type: 'Pet' })
            },
          }),
          objectType({
            name: 'Horse',
            definition(t) {
              t.implements('Equine')
              t.modify('mother', { type: 'Equine' })
            },
          }),
          objectType({
            name: 'Donkey',
            definition(t) {
              t.implements('Equine')
              t.modify('mother', { type: 'Equine' })
            },
          }),
          objectType({
            name: 'Mule',
            definition(t) {
              t.implements('Equine')
              t.modify('mother', { type: 'Equine' })
            },
          }),
        ],
        outputs: false,
        features: {
          abstractTypeRuntimeChecks: false,
        },
      }))
    })

    it('should output a valid schema', () => {
      expect(schemaTypes).toMatchSnapshot()
    })
  })
})
