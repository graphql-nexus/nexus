import { testApp } from '../../../__helpers/testApp'

/** Ensures that resolveType and isTypeOf strategies are set to optional when __typename strategy is enabled */
testApp({
  rootDir: __dirname,
  name: 'allStrategiesOptionalWhenTypeNameEnabled',
  config: {
    features: {
      abstractTypeStrategies: {
        resolveType: true,
        isTypeOf: true,
        __typename: true,
      },
    },
  },
})
