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
      },
    },
  },
})

it('fails when missing resolveType implementation', async () => {
  const { emitDiagnostics, preEmitDiagnostics } = typeCheck({ rootDir })

  expect(preEmitDiagnostics.map((e) => e.getMessageText())).toMatchInlineSnapshot(`
    Array [
      DiagnosticMessageChain {
        "_compilerObject": Object {
          "category": 1,
          "code": 2345,
          "messageText": "Argument of type '{ name: \\"Union\\"; definition(t: UnionDefinitionBlock): void; }' is not assignable to parameter of type 'NexusUnionTypeConfig<\\"Union\\">'.",
          "next": Array [
            Object {
              "category": 1,
              "code": 2741,
              "messageText": "Property 'resolveType' is missing in type '{ name: \\"Union\\"; definition(t: UnionDefinitionBlock): void; }' but required in type '{ resolveType: AbstractTypeResolver<\\"Union\\">; }'.",
              "next": undefined,
            },
          ],
        },
      },
    ]
  `)
  expect(emitDiagnostics.map((e) => e.getMessageText())).toMatchInlineSnapshot(`Array []`)
})
