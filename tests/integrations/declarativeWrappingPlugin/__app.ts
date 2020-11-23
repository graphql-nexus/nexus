import { objectType, queryField, intArg } from '../../../src'
import './__typegen'

const DeclarativeWrappingOutput = objectType({
  name: 'DeclarativeWrappingOutput',
  definition(t) {
    t.string('someNullField', {
      nullable: true,
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
