import { printSchema } from 'graphql'
import os from 'os'
import path from 'path'
import { generateSchema, makeSchema } from '../src/builder'
import { queryField } from '../src/definitions/queryField'

describe('makeSchema', () => {
  describe('shouldExitAfterGenerateArtifacts', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('exits with 0 code after successful write', (done) => {
      const logSpy = jest.spyOn(console, 'log').mockImplementationOnce(() => {})
      jest.spyOn(process, 'exit').mockImplementationOnce((code) => {
        expect(code).toEqual(0)
        expect(logSpy.mock.calls[0][0]).toContain('Generated Artifacts:')
        return done() as never
      })
      makeSchema({
        types: [
          queryField('someField', {
            type: 'String',
            resolve: () => 'Test',
          }),
        ],
        outputs: {
          typegen: path.join(os.tmpdir(), '/file.ts'),
          schema: path.join(os.tmpdir(), '/schema.graphql'),
        },
        shouldGenerateArtifacts: true,
        shouldExitAfterGenerateArtifacts: true,
      })
    })

    // using jest.spyOn on process.exit doesn't not work on Windows
    if (process.platform !== 'win32') {
      it('exits with 1 code and logs error after failure', (done) => {
        const errSpy = jest.spyOn(console, 'error').mockImplementationOnce(() => {})
        jest.spyOn(process, 'exit').mockImplementationOnce((code) => {
          expect(code).toEqual(1)
          expect(errSpy.mock.calls[0][0].message).toEqual(
            `ENOTDIR: not a directory, open '/dev/null/schema.graphql'`
          )
          expect(errSpy.mock.calls.length).toEqual(1)
          return done() as never
        })
        makeSchema({
          types: [
            queryField('someField', {
              type: 'String',
              resolve: () => 'Test',
            }),
          ],
          outputs: {
            typegen: path.normalize(`/dev/null/file.ts`),
            schema: path.normalize(`/dev/null/schema.graphql`),
          },
          shouldGenerateArtifacts: true,
          shouldExitAfterGenerateArtifacts: true,
        })
      })
    }

    it('accepts a customPrintSchemaFn', async () => {
      const { schemaTypes } = await generateSchema.withArtifacts(
        {
          types: [
            queryField('ok', {
              description: 'Example boolean field',
              type: 'Boolean',
            }),
          ],
          outputs: {},
          customPrintSchemaFn: (schema) => {
            return printSchema(schema, { commentDescriptions: true })
          },
        },
        false
      )
      expect(schemaTypes).toMatchSnapshot()
    })
  })

  describe('contextType', () => {
    it('can specify contextType as a typing import', async () => {
      const { tsTypes } = await generateSchema.withArtifacts(
        {
          outputs: false,
          types: [
            queryField('ok', {
              description: 'Example boolean field',
              type: 'Boolean',
            }),
          ],
          shouldGenerateArtifacts: true,
          typegenAutoConfig: {
            sources: [],
            contextType: {
              path: 'graphql',
              name: 'GraphQLInputFieldConfigMap',
            },
          },
        },
        path.normalize(`/dev/null/file.ts`)
      )
      expect(tsTypes).toContain(`import { GraphQLInputFieldConfigMap } from "graphql"`)
      expect(tsTypes).toContain(`context: GraphQLInputFieldConfigMap`)
    })
  })
})
