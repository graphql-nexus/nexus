import { testApp } from '../../../__helpers/testApp'

/**
 * Ensures that when resolveType and isTypeOf are true, if resolveType is implemented, isTypeOf implementations become optionals
 */
testApp({
  rootDir: __dirname,
  name: 'isTypeOfsImplemented',
  config: {
    features: {
      abstractTypeStrategies: {
        resolveType: true,
        isTypeOf: true,
      },
    },
  },
})
