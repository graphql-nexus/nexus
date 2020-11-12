import { testApp } from '../../../__helpers/testApp'

/**
 * Ensures that when resolveType and isTypeOf are true, if all isTypeOf are implemented, the resolveType implementation become optional
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
