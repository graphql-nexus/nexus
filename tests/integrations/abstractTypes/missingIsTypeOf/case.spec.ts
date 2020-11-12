import { typeCheck } from '../../../_setup'
import { installGenerateTypegenHook } from '../../../__helpers'

const rootDir = __dirname

installGenerateTypegenHook({
  rootDir,
  config: {
    features: {
      abstractTypeStrategies: {
        isTypeOf: true,
      },
    },
  },
})

it('fails when missing isTypeOf implementation', async () => {
  const { emitDiagnostics, preEmitDiagnostics } = typeCheck({ rootDir })

  expect(preEmitDiagnostics.map((e) => e.getMessageText())).toMatchInlineSnapshot(`
    Array [
      DiagnosticMessageChain {
        "_compilerObject": Object {
          "category": 1,
          "code": 2345,
          "messageText": "Argument of type '{ name: \\"B\\"; definition(t: ObjectDefinitionBlock<\\"B\\">): void; }' is not assignable to parameter of type 'NexusObjectTypeConfig<\\"B\\">'.",
          "next": Array [
            Object {
              "category": 1,
              "code": 2741,
              "messageText": "Property 'isTypeOf' is missing in type '{ name: \\"B\\"; definition(t: ObjectDefinitionBlock<\\"B\\">): void; }' but required in type '{ isTypeOf: IsTypeOfHandler<\\"B\\">; }'.",
              "next": undefined,
            },
          ],
        },
      },
    ]
  `)
  expect(emitDiagnostics.map((e) => e.getMessageText())).toMatchInlineSnapshot(`Array []`)
})
