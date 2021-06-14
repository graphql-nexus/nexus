import { testApp } from '../../__helpers'
import { declarativeWrappingPlugin } from '../../../src'

testApp({
  rootDir: __dirname,
  name: 'declarativeWrappingPlugin',
  config: {
    plugins: [declarativeWrappingPlugin()],
  },
})
