import { core } from '../../src'

const EXAMPLE_SDL = `
type Query {
  employee: Employee!
}

interface Person {
  name: String!
}

interface Employee implements Person {
  name: String!
  salary: Int! 
}

type Engineer implements Employee & Person {
  name: String!
  salary: Int! 
}
`
const { SDLConverter } = core

describe('SDLConverter', () => {
  test('printInterfaceTypes', () => {
    expect(new SDLConverter(EXAMPLE_SDL).printInterfaceTypes()).toMatchSnapshot()
  })
})
