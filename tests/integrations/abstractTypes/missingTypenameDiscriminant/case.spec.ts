import { typeCheck } from '../../../_setup'
import { installGenerateTypegenHook } from '../../../__helpers'

const rootDir = __dirname

installGenerateTypegenHook({
  rootDir,
  config: {
    features: {
      abstractTypeStrategies: {
        __typename: true,
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
          "code": 2322,
          "messageText": "Type '() => { name: string; }' is not assignable to type 'FieldResolver<\\"Query\\", \\"union\\">'.",
          "next": Array [
            Object {
              "category": 1,
              "code": 2322,
              "messageText": "Type '{ name: string; }' is not assignable to type 'MaybePromise<({ name?: string | null | undefined; } & { __typename: \\"A\\"; }) | ({ age?: number | null | undefined; } & { __typename: \\"B\\"; }) | null>'.",
              "next": Array [
                Object {
                  "category": 1,
                  "code": 2322,
                  "messageText": "Type '{ name: string; }' is not assignable to type '{ name?: string | null | undefined; } & { __typename: \\"A\\"; }'.",
                  "next": Array [
                    Object {
                      "category": 1,
                      "code": 2741,
                      "messageText": "Property '__typename' is missing in type '{ name: string; }' but required in type '{ __typename: \\"A\\"; }'.",
                      "next": undefined,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ]
  `)
  expect(emitDiagnostics.map((e) => e.getMessageText())).toMatchInlineSnapshot(`Array []`)
})
