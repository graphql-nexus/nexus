import { objectType, queryField, intArg, inputObjectType } from '../../../src'
import './__typegen'

const DeclarativeWrappingOutput = objectType({
  name: 'DeclarativeWrappingOutput',
  definition(t) {
    t.string('someNullField', {
      nullable: true,
      args: {
        input: inputObjectType({
          name: 'InlineInputType',
          definition(t) {
            t.int('abc', { required: true })
          },
        }).asArg(),
      },
    })
    t.string('someRequiredField', {
      nullable: false,
      resolve: () => 'Some Field',
    })
    t.string('someList', {
      list: true,
      resolve: () => [],
    })
    t.string('someListOfLists', {
      list: [true, true],
      args: {
        int: intArg({ required: true }),
      },
      resolve: () => [],
    })
  },
  rootTyping: '{name: "Test"}',
})

export const someField = queryField('someField', {
  type: DeclarativeWrappingOutput,
  nullable: false,
  resolve: () => ({ name: 'Test' }),
})
