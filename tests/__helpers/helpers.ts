import * as GQL from 'graphql'
import { inputObjectType, objectType } from '../../src'

/**
 * Used in testing, creates a generic "User" object
 */
export const UserObject = objectType({
  name: 'User',
  definition(t) {
    t.id('id', { resolve: () => `User:1` as any })
    t.string('email', { resolve: () => 'test@example.com' as any })
    t.string('name', { resolve: () => `Test User` as any })
  },
})

export const PostObject = objectType({
  name: 'Post',
  definition(t) {
    t.field('user', { type: UserObject })
  },
})

export const InputObject = inputObjectType({
  name: 'Something',
  definition(t) {
    t.int('id')
  },
})

export const restoreEnvBeforeEach = () => {
  let envBackup = { ...process.env }
  beforeEach(() => {
    process.env = { ...envBackup }
  })
}

/**
 * Subscription helpers
 */

export function subscribe(
  schema: GQL.GraphQLSchema,
  document: string
): Promise<AsyncIterableIterator<GQL.ExecutionResult>> {
  const documentAST = GQL.parse(document)
  return GQL.subscribe({ schema, document: documentAST }) as Promise<
    AsyncIterableIterator<GQL.ExecutionResult>
  >
}

export function take<T>(n: number) {
  return async (asyncIterableIterator: AsyncIterableIterator<T>): Promise<T[]> => {
    let i = 0
    const vals = []
    for await (const x of asyncIterableIterator) {
      i++
      vals.push(x)
      if (i >= n) break
    }
    return vals
  }
}

export async function* mockStream<T>(interval: number, seed: T, next: (previous: T) => T) {
  let curr = seed
  while (true) {
    curr = next(curr)
    yield curr
    await new Promise((res) => {
      setTimeout(res, interval)
    })
  }
}
