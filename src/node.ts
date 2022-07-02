export function nodeImports() {
  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  return {
    fs,
    path,
  }
}
