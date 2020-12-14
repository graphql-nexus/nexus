import { PrismaClient } from '@prisma/client'
import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import { makeSchema, nullable, objectType, queryType, stringArg } from 'nexus'
import * as path from 'path'

const prisma = new PrismaClient()

const apollo = new ApolloServer({
  context: () => ({ prisma }),
  schema: makeSchema({
    sourceTypes: {
      modules: [{ module: '.prisma/client', alias: 'PrismaClient' }],
    },
    contextType: {
      module: path.join(__dirname, 'context.ts'),
      export: 'Context',
    },
    outputs: {
      typegen: path.join(
        __dirname,
        'node_modules/@types/nexus-typegen/index.d.ts',
      ),
      schema: path.join(__dirname, './api.graphql'),
    },
    shouldExitAfterGenerateArtifacts: Boolean(
      process.env.NEXUS_SHOULD_EXIT_AFTER_REFLECTION,
    ),
    types: [
      objectType({
        name: 'User',
        definition(t) {
          t.id('id')
          t.string('name', {
            resolve(parent) {
              return parent.name
            },
          })
        },
      }),
      queryType({
        definition(t) {
          t.list.field('users', {
            type: 'User',
            args: {
              world: nullable(stringArg()),
            },
            resolve(_root, _args, ctx) {
              return ctx.prisma.user.findMany()
            },
          })
        },
      }),
    ],
  }),
})

const app = express()

apollo.applyMiddleware({ app })

app.listen(4000, () => {
  console.log(`🚀 GraphQL service ready at http://localhost:4000/graphql`)
})
