import { testApp } from '../../__helpers/testApp'

testApp({
  rootDir: __dirname,
  config: {
    features: {
      abstractTypeStrategies: {
        resolveType: true,
      },
    },
  },
})
