import { generateSchema, interfaceType, objectType } from '../../src/core'

describe('interfaceType', () => {
  it('deduplicates interfaces implementing interfaces', async () => {
    const { schemaTypes } = await generateSchema.withArtifacts(
      {
        types: [
          interfaceType({
            name: 'Node',
            resolveType() {
              return null
            },
            definition(t) {
              t.id('id')
            },
          }),
          interfaceType({
            name: 'Node2',
            resolveType() {
              return null
            },
            definition(t) {
              t.implements('Node')
              t.id('id2')
            },
          }),
          objectType({
            name: 'Foo',
            isTypeOf() {
              return true
            },
            definition(t) {
              t.implements('Node2', 'Node')
            },
          }),
        ],
        outputs: false,
      },
      null
    )
    expect(schemaTypes.trim()).toMatchSnapshot()
  })
})
