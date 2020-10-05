import Prism from 'prism-react-renderer/prism'
;(typeof global !== 'undefined' ? global : window).Prism = Prism
Prism.languages.prisma = Prism.languages.extend('javascript', {
  keyword: /\b(?:datasource|enum|generator|model|type)\b/,
})

Prism.languages.insertBefore('prisma', 'function', {
  annotation: {
    pattern: /(^|[^.])@+\w+/,
    lookbehind: true,
    alias: 'punctuation',
  },
})

Prism.languages.insertBefore('prisma', 'punctuation', {
  'type-args': /\b(?:references|fields):/,
})
