import {
  arg,
  booleanArg,
  connectionPlugin,
  core,
  declarativeWrappingPlugin,
  directive,
  dynamicInputMethod,
  dynamicOutputMethod,
  dynamicOutputProperty,
  enumType,
  extendType,
  idArg,
  inputObjectType,
  interfaceType,
  mutationType,
  nonNull,
  objectType,
  queryType,
  scalarType,
  stringArg,
  subscriptionField,
  subscriptionType,
  useDirective,
} from '../../../src'
import { mockStream } from '../../__helpers'
import './__typegen'

export const typeDirective = directive({
  name: 'TestTypeDirective',
  locations: ['OBJECT', 'INTERFACE', 'ENUM', 'SCALAR'],
  description: 'Testing type directives',
  args: {
    bool: booleanArg(),
  },
})

export const fieldDirective = directive({
  name: 'TestFieldDirective',
  locations: ['FIELD_DEFINITION', 'INPUT_FIELD_DEFINITION'],
  description: 'Testing the object directive',
  args: {
    bool: booleanArg(),
  },
})

export const testAllDirective = directive({
  name: 'TestAllDirective',
  locations: core.SchemaLocation,
  description: 'Testing directive in all positions',
})

export const testRequiredArgDirective = directive({
  name: 'TestRequiredArgDirective',
  locations: ['OBJECT'],
  description: 'Testing with required arg',
  args: {
    bool: nonNull(booleanArg()),
  },
})

export const testRepeatableDirective = directive({
  name: 'TestRepeatableDirective',
  locations: core.SchemaLocation,
  description: 'Testing a repeatable directive',
  isRepeatable: true,
})

export const scalar = scalarType({
  name: 'MyCustomScalar',
  description: 'No-Op scalar for testing purposes only',
  asNexusMethod: 'myCustomScalar',
  serialize() {},
  directives: [testAllDirective],
})

export const query = queryType({
  definition(t) {
    t.string('foo', { resolve: () => 'bar' })
    t.myCustomScalar('customScalar')
  },
  directives: [testRepeatableDirective, testRepeatableDirective],
})

const mockData = {
  posts: [{ title: '', body: '' }],
  user: { firstName: '', lastName: '' },
}

export const I = interfaceType({
  name: 'I',
  resolveType() {
    return 'OfI'
  },
  definition(t) {
    t.string('hello', {
      extensions: {
        extensionAdditionFromFieldConfig: true,
      },
      directives: [fieldDirective({ bool: true })],
    })
  },
})

export const i = objectType({
  name: 'OfI',
  definition(t) {
    t.implements('I')
  },
  directives: [typeDirective],
})

export const i2 = objectType({
  name: 'OfI2',
  extensions: {
    extensionAdditionFromTypeConfig: true,
  },
  definition(t) {
    t.implements('I')
    t.modify('hello', {
      extensions: {
        extensionAdditionFromModifyMethod: true,
      },
    })
  },
})

export const dom = dynamicOutputMethod({
  name: 'title',
  typeDefinition: '(options: { escape: boolean }): void',
  typeDescription: 'Title of the page, optionally escaped',
  factory: ({ typeDef: t }) => {
    t.string('title')
  },
})

export const dim = dynamicInputMethod({
  name: 'title',
  factory: ({ typeDef: t }) => {
    t.string('title')
  },
})

export const dop = dynamicOutputProperty({
  name: 'body',
  typeDescription: 'adds a body (weirdly, as a getter)',
  factory: ({ typeDef: t }) => {
    t.string('body')
  },
})

export const PostSearchInput = inputObjectType({
  name: 'PostSearchInput',
  definition(t) {
    t.title()
    t.string('body')
  },
})

export const someArg = arg({
  type: inputObjectType({
    name: 'Something',
    definition(t) {
      t.nonNull.int('id')
    },
  }),
  default: { id: 1 },
})

export const Post = objectType({
  name: 'Post',
  definition(t) {
    t.title({ escape: true })
    // tslint:disable-next-line: no-unused-expression
    t.body
  },
  directives: [testRequiredArgDirective({ bool: true })],
})

export const User = objectType({
  name: 'User',
  definition(t) {
    t.string('firstName')
    t.string('lastName')
    t.connectionField('posts', {
      type: Post,
      nodes() {
        return mockData.posts
      },
      totalCount(root) {
        if (!root.firstName) {
          // root.firstName should be the source value here
          throw new Error()
        }
        return 0
      },
      edgeFields: {
        delta(root, args, ctx) {
          if (root.cursor) {
            // Cursor should be defined here
          }
          if (args.format === 'ms') {
            return '5ms'
          }
          return '0.005s'
        },
      },
    })
  },
  sourceType: `{ firstName: string, lastName: string }`,
})

export const Query = extendType({
  type: 'Query',
  definition(t) {
    t.list.field('searchPosts', {
      type: 'Post',
      args: { input: PostSearchInput },
      resolve: () => mockData.posts,
    })
    t.field('user', {
      type: 'User',
      args: {
        id: idArg(),
        status: enumType({
          name: 'UserStatus',
          members: [
            { name: 'ACTIVE', value: 'active' },
            { name: 'PENDING', value: 'pending' },
          ],
        }).asArg({ default: 'active', directives: [testAllDirective] }),
      },
      resolve: () => mockData.user,
    })
  },
})

export const Mutation = mutationType({
  definition(t) {
    t.field('createUser', {
      type: 'User',
      args: { firstName: stringArg(), lastName: stringArg() },
      resolve: (_root) => ({ firstName: '', lastName: '' }),
    })
  },
})

export const Subscription2 = extendType({
  type: 'Subscription',
  definition(t) {
    t.boolean('someBooleanFromExtendType', {
      subscribe() {
        return mockStream(10, true, (b) => b)
      },
      resolve: (event: boolean) => {
        return event
      },
    })
  },
})

export const Subscription3 = subscriptionField((t) => {
  t.boolean('someBooleanFromSubscriptionField', {
    subscribe() {
      return mockStream(10, true, (b) => b)
    },
    resolve: (event: boolean) => {
      return event
    },
  })
})

export const Subscription = subscriptionType({
  definition(t) {
    // lists
    t.list.field('someFields', {
      type: 'Int',
      subscribe() {
        return mockStream(10, 0, (int) => int - 1)
      },
      resolve: (event: number) => {
        return [event]
      },
    })
    t.list.int('someInts', {
      subscribe() {
        return mockStream(10, 0, (int) => int + 1)
      },
      resolve: (event: number) => {
        return [event]
      },
    })
    // singular
    t.field('someField', {
      type: 'Int',
      subscribe() {
        return mockStream(10, 0, (int) => int - 1)
      },
      resolve: (event: number) => {
        return event
      },
    })
    t.int('someInt', {
      subscribe() {
        return mockStream(10, 0, (int) => int + 1)
      },
      resolve: (event: number) => {
        return event
      },
      directives: [testAllDirective],
    })
    t.string('someString', {
      subscribe() {
        return mockStream(10, '', (str) => str + '!')
      },
      resolve: (event: string) => {
        return event
      },
      directives: [useDirective('TestFieldDirective', { bool: true })],
    })
    t.float('someFloat', {
      subscribe() {
        return mockStream(10, 0.5, (f) => f)
      },
      resolve: (event: number) => {
        return event
      },
    })
    t.boolean('someBoolean', {
      subscribe() {
        return mockStream(10, true, (b) => b)
      },
      resolve: (event: boolean) => {
        return event
      },
    })
    t.id('someID', {
      subscribe() {
        return mockStream(10, 'abc', (id) => id)
      },
      resolve: (event: string) => {
        return event
      },
    })
  },
})

export const plugins = [
  declarativeWrappingPlugin({ disable: true }),
  connectionPlugin({
    extendEdge: {
      delta: {
        type: 'String',
        args: {
          format: 'String',
        },
      },
    },
    extendConnection: {
      totalCount: {
        type: nonNull('Int'),
      },
    },
  }),
]
