import { printSchema } from 'graphql'
import { makeSchema, objectType } from '../src'

describe('builder', () => {
  it('can replace the Query root type with an alternate type', () => {
    const OtherQuery = objectType({
      name: 'RootQuery',
      definition(t) {
        t.string('name')
      },
    })

    const Query = objectType({
      name: 'Query',
      definition(t) {
        t.string('ok')
      },
    })

    const schema = makeSchema({
      types: [OtherQuery, Query],
      schemaRoots: {
        query: OtherQuery,
      },
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('can replace the Mutation root type with an alternate type', () => {
    const OtherMutation = objectType({
      name: 'RootMutation',
      definition(t) {
        t.string('name')
      },
    })

    const Mutation = objectType({
      name: 'Mutation',
      definition(t) {
        t.string('ok')
      },
    })

    const schema = makeSchema({
      types: [OtherMutation, Mutation],
      schemaRoots: {
        mutation: OtherMutation,
      },
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('can replace the Subscription root type with an alternate type', () => {
    const OtherSubscription = objectType({
      name: 'RootSubscription',
      definition(t) {
        t.string('name')
      },
    })

    const Subscription = objectType({
      name: 'Subscription',
      definition(t) {
        t.string('ok')
      },
    })

    const schema = makeSchema({
      types: [OtherSubscription, Subscription],
      schemaRoots: {
        subscription: OtherSubscription,
      },
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })
})
