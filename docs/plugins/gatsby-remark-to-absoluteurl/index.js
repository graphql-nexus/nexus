var visit = require('unist-util-visit')
const path = require('path')

function withPathPrefix(url, pathPrefix) {
  const prefixed = pathPrefix + url
  return prefixed.replace(/\/\//, '/')
}

const pathSep = '/'

module.exports = function plugin(
  { markdownAST, markdownNode, pathPrefix, getNode },
  { redirects = [] } = {}
) {
  function visitor(node) {
    //To convert all uppercase links to lowercase (if used by mistake)
    node.url = node.url.toLowerCase()

    node.originalUrl = node.url
    if (
      markdownNode.fields &&
      markdownNode.fields.slug &&
      !node.url.startsWith('/') &&
      !node.url.startsWith('#') &&
      !node.url.startsWith('mailto:') &&
      !/^https?:\/\//.test(node.url)
    ) {
      const parent = getNode(markdownNode.parent)
      const newUrl = path
        .resolve(
          markdownNode.fields.slug
            .replace(`${pathSep}index`, '')
            .replace(/\d+-/g, '')
            .replace(/\/$/, '')
            .split(pathSep)
            .slice(0, parent.name === 'index' ? undefined : -1)
            .join(pathSep) || '/',
          node.url
        )
        .replace(/\/?(\?|#|$)/, '/$1')

      if (/^..\\/.test(newUrl)) {
        //Code specifically for local run, to fix broken links on
        let newUrl2 = path.resolve(
          markdownNode.fields.slug.replace(/(\/.+)\/.*/, '$1').replace(/\/\d+-/g, '/'),
          node.url
        )

        newUrl2 = newUrl2
          .replace(/\\/g, '/')
          .slice(2)
          .replace(/(^.*)#.*/, '$1')
        const isRedirectPath = redirects.find(url => newUrl2.includes(url.from))
        if (isRedirectPath) newUrl2 = isRedirectPath.to

        let hashVal = node.url.match(/#.*/)
        if (hashVal) newUrl2 += hashVal[0]

        node.url = newUrl2.replace(/^([^#]*)$/, '$1/')
      } else {
        const isRedirectPath = redirects.find(url => newUrl.includes(url.from))
        node.url = withPathPrefix(
          isRedirectPath ? newUrl.replace(isRedirectPath.from, isRedirectPath.to) : newUrl,
          pathPrefix
        )
      }
    }
  }

  visit(markdownAST, 'link', visitor)

  return markdownAST
}
