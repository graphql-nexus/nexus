import { makeSchema, objectType, queryType, stringArg } from '@nexus/schema'
import { PrismaClient } from '@prisma/client'
import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import * as path from 'path'

const prisma = new PrismaClient()

const apollo = new ApolloServer({
  context: () => ({ prisma }),
  schema: makeSchema({
    typegenAutoConfig: {
      contextType: '{ prisma: PrismaClient.PrismaClient }',
      sources: [{ source: '.prisma/client', alias: 'PrismaClient' }],
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
              world: stringArg({ required: false }),
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
