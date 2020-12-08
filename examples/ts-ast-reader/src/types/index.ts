import { nonNull, objectType, stringArg } from '@nexus/schema'
import ts from 'typescript'
import fs from 'fs-extra'

export * from './typeNodes'
export * from './declarations'
export * from './enums'
export * from './interfaces'
export * from './mixins'
export * from './objects'
export * from './unions'
export * from './jsdoc'

export const Query = objectType({
  name: 'Query',
  definition(t) {
    t.field('parseFile', {
      type: 'SourceFile',
      args: {
        file: nonNull(stringArg()),
      },
      async resolve(root, args, ctx) {
        const fileContents = await fs.readFile(args.file, 'utf-8')
        const sourceFile = ts.createSourceFile(args.file, fileContents, ts.ScriptTarget.ES2017)
        ctx.source = sourceFile

        return sourceFile
      },
    })
  },
})
