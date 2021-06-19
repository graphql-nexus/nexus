import { graphql } from 'graphql'
import { makeSchema, objectType, queryField } from '../../src'
import { list, NEXUS_BUILD, NEXUS_TYPE, nonNull, nullable } from '../../src/core'

interface UserData {
  id?: string
  ok?: boolean
}

class Post {
  static [NEXUS_TYPE]() {
    return objectType({
      name: 'Post',
      definition(t) {
        t.string('content')
        t.field('author', {
          type: 'User',
        })
      },
    })
  }
}

class User {
  constructor(readonly data: UserData = {}) {}

  id() {
    return this.data.id ?? 'User:1'
  }

  ok() {
    return this.data.ok ?? true
  }

  get info() {
    return {}
  }

  static [NEXUS_TYPE]() {
    return objectType({
      name: 'User',
      definition(t) {
        t.id('id')
        t.boolean('ok')
        t.field('info', { type: nonNull(UserInfo) })
        t.field('friend', {
          type: User,
          resolve: () => new User({ id: 'User:2', ok: false }),
        })
        t.field('posts', {
          type: list(Post),
        })
        t.field('topPost', {
          type: nullable(Post),
        })
      },
    })
  }

  static [NEXUS_BUILD]() {
    return [
      queryField('user', () => ({
        type: User,
        resolve: () => new User(),
      })),
    ]
  }
}

class UserType {
  constructor(readonly data: UserData = {}) {}

  id() {
    return this.data.id ?? 'UserType:1'
  }

  ok() {
    return this.data.ok ?? true
  }

  get info() {
    return {}
  }

  static [NEXUS_BUILD]() {
    Object.defineProperty(this, NEXUS_TYPE, {
      value: objectType({
        name: 'UserType',
        definition(t) {
          t.id('id')
          t.boolean('ok')
          t.field('info', { type: UserInfo })
        },
      }),
    })
    return [
      queryField('user', () => ({
        type: 'UserType',
        resolve: () => new UserType(),
      })),
    ]
  }
}

class UserInfo {
  static [NEXUS_TYPE] = objectType({
    name: 'UserInfo',
    definition(t) {
      t.string('text', {
        resolve: () => 'Info',
      })
    },
  })
}

describe('nexusMeta', () => {
  test('NEXUS_TYPE method', async () => {
    const schema = makeSchema({
      types: [User, User], // Shouldn't be an issue importing twice
      outputs: {
        schema: false,
        typegen: false,
      },
      shouldGenerateArtifacts: false,
    })
    expect(
      await graphql(
        schema,
        `
          query UserToNexus {
            user {
              id
              ok
              info {
                text
              }
              friend {
                id
                ok
              }
            }
          }
        `
      )
    ).toMatchSnapshot()
  })

  test('NEXUS_BUILD can define NEXUS_TYPE', async () => {
    const schema = makeSchema({
      types: [UserType, UserType], // Shouldn't be an issue importing twice
      outputs: {
        schema: false,
        typegen: false,
      },
      shouldGenerateArtifacts: false,
    })
    expect(
      await graphql(
        schema,
        `
          query UserToNexus {
            user {
              id
              ok
              info {
                text
              }
            }
          }
        `
      )
    ).toMatchSnapshot()
  })
})
