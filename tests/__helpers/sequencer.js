// testSequencer.js
const path = require('path')
const Sequencer = require('@jest/test-sequencer').default

class NexusSequencer extends Sequencer {
  sort(tests) {
    // Test structure information
    // https://github.com/facebook/jest/blob/6b8b1404a1d9254e7d5d90a8934087a9c9899dab/packages/jest-runner/src/types.ts#L17-L21
    const copyTests = Array.from(tests)
    return copyTests.sort((testA, testB) =>
      testA.path.includes(path.join('tests', 'integrations')) ? 1 : -1
    )
  }
}

module.exports = NexusSequencer
