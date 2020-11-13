import { typeCheck } from '../../../_setup'
import { installGenerateTypegenHook } from '../../../__helpers'

const rootDir = __dirname

installGenerateTypegenHook({
  rootDir,
  config: {
    features: {
      abstractTypeRuntimeChecks: false,
      abstractTypeStrategies: {
        resolveType: true,
        isTypeOf: true,
      },
    },
  },
})

it('fails when missing isTypeOf or resolveType implementation', async () => {
  const { emitDiagnostics, preEmitDiagnostics } = typeCheck({ rootDir })

  expect(preEmitDiagnostics.map((e) => e.getMessageText())).toMatchInlineSnapshot(`
    Array [
      DiagnosticMessageChain {
        "_compilerObject": Object {
          "category": 1,
          "code": 2345,
          "messageText": "Argument of type '{ name: \\"A\\"; definition(t: ObjectDefinitionBlock<\\"A\\">): void; }' is not assignable to parameter of type 'NexusObjectTypeConfig<\\"A\\">'.",
          "next": Array [
            Object {
              "category": 1,
              "code": 2741,
              "messageText": "Property 'isTypeOf' is missing in type '{ name: \\"A\\"; definition(t: ObjectDefinitionBlock<\\"A\\">): void; }' but required in type '{ isTypeOf: IsTypeOfHandler<\\"A\\">; }'.",
              "next": undefined,
            },
          ],
        },
      },
      DiagnosticMessageChain {
        "_compilerObject": Object {
          "category": 1,
          "code": 2345,
          "messageText": "Argument of type '{ name: \\"U2\\"; definition(t: UnionDefinitionBlock): void; }' is not assignable to parameter of type 'NexusUnionTypeConfig<\\"U2\\">'.",
          "next": Array [
            Object {
              "category": 1,
              "code": 2741,
              "messageText": "Property 'resolveType' is missing in type '{ name: \\"U2\\"; definition(t: UnionDefinitionBlock): void; }' but required in type '{ resolveType: AbstractTypeResolver<\\"U2\\">; }'.",
              "next": undefined,
            },
          ],
        },
      },
    ]
  `)
  expect(emitDiagnostics.map((e) => e.getMessageText())).toMatchInlineSnapshot(`Array []`)
})
