export type TestContext = {
  user: User | null
}

export interface User {
  firstName: string
  lastName: string
  email: string
  fullName(): string
}

export enum A {
  ONE = 'ONE',
  TWO = 'TWO',
}

export const enum B {
  NINE = '9',
  TEN = '10',
}
