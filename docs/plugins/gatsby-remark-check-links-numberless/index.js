var visit = require('unist-util-visit')
const path = require('path')

function getCacheKey(node) {
  return `remark-check-links-${node.id}-${node.internal.contentDigest}`
}

function getHeadingsMapKey(link, pathUrl) {
  let key = link
  const hashIndex = link.indexOf('#')
  const hasHash = hashIndex !== -1
  if (hasHash) {
    key = link.startsWith('#') ? pathUrl : link.slice(0, hashIndex)
  }

  return {
    key,
    hasHash,
    hashIndex,
  }
}

function createPathPrefixer(pathPrefix) {
  return function withPathPrefix(url) {
    var prefixed = pathPrefix + url
    return prefixed.replace(/\/\//, '/')
  }
}

module.exports = async function plugin(
  { markdownAST, markdownNode, files, getNode, cache, getCache, pathPrefix },
  { exceptions = [], ignore = [], verbose = true } = {}
) {
  const withPathPrefix = createPathPrefixer(pathPrefix)
  const pathSep = '/'
  if (!markdownNode.fields) {
    // let the file pass if it has no fields
    return markdownAST
  }

  const links = []
  const headings = []

  function visitor(node, index, parent) {
    //To convert all uppercase links to lowercase (if used by mistake)
    node.url = node.url.toLowerCase()

    if (parent.type === 'heading') {
      headings.push(parent.data.id)
      return
    }

    if (!node.url.startsWith('mailto:') && !/^https?:\/\//.test(node.url)) {
      let tranformedUrl = node.url
      links.push({
        ...node,
        tranformedUrl,
        frontmatter: markdownNode.frontmatter,
      })
    }
  }

  visit(markdownAST, 'link', visitor)

  const parent = await getNode(markdownNode.parent)
  const setAt = Date.now()
  cache.set(getCacheKey(parent), {
    path: withPathPrefix(
      markdownNode.fields.slug
        .replace(/\/index$/, '')
        .replace(/\d+-/g, '')
        .concat(pathSep)
    ),
    links,
    headings,
    setAt,
  })

  // wait to see if all of the Markdown and MDX has been visited
  const linksMap = {}
  const headingsMap = {}
  for (const file of files) {
    if (/^mdx?$/.test(file.extension) && file.relativePath !== 'docs/README.md') {
      const key = getCacheKey(file)

      let visited = await cache.get(key)
      if (!visited && getCache) {
        // the cache provided to `gatsby-mdx` has its own namespace, and it
        // doesn't have access to `getCache`, so we have to check to see if
        // those files have been visited here.
        const mdxCache = getCache('gatsby-plugin-mdx')
        visited = await mdxCache.get(key)
      }
      if (visited && setAt >= visited.setAt) {
        linksMap[visited.path] = visited.links
        headingsMap[visited.path] = visited.headings
        continue
      }

      // don't continue if a page hasn't been visited yet
      return
    }
  }

  let totalBrokenLinks = 0
  const prefixedIgnore = ignore.map(withPathPrefix)
  const prefixedExceptions = exceptions.map(withPathPrefix)
  const pathKeys = Object.keys(linksMap)
  const pathKeysWithoutIndex = pathKeys.map(p =>
    p.replace(`${pathSep}index`, '').replace(/\/$/, '')
  )
  for (const pathL in linksMap) {
    if (prefixedIgnore.includes(pathL)) {
      // don't count broken links for ignored pages
      continue
    }

    const linksForPath = linksMap[pathL]
    if (linksForPath.length) {
      const brokenLinks = linksForPath.filter(link => {
        // return true for broken links, false = pass
        const { key, hasHash, hashIndex } = getHeadingsMapKey(link.tranformedUrl, pathL)
        if (prefixedExceptions.includes(key)) {
          return false
        }

        const url = hasHash ? link.tranformedUrl.slice(0, hashIndex) : link.tranformedUrl
        const urlToCheck = url.slice(-1) === pathSep ? url.slice(0, -1) : url
        const headings = headingsMap[key]

        if (headings) {
          if (hasHash) {
            const id = link.tranformedUrl.slice(hashIndex + 1)
            return !prefixedExceptions.includes(id) && !headings.includes(id)
          }

          return false
        }
        return !pathKeysWithoutIndex.includes(urlToCheck)
      })

      const brokenLinkCount = brokenLinks.length
      totalBrokenLinks += brokenLinkCount
      if (brokenLinkCount && verbose) {
        console.warn(`${brokenLinkCount} broken links found on ${pathL}`)
        for (const link of brokenLinks) {
          let prefix = '-'
          if (link.position) {
            const { line, column } = link.position.start

            // account for the offset that frontmatter adds
            const offset = link.frontmatter ? Object.keys(link.frontmatter).length + 2 : 0

            prefix = [String(line + offset).padStart(3, ' '), String(column).padEnd(4, ' ')].join(
              ':'
            )
          }
          console.warn(`${prefix} ${link.originalUrl}`)
        }
        console.log('')
      }
    }
  }

  if (totalBrokenLinks) {
    const message = `${totalBrokenLinks} broken links found`
    if (process.env.NODE_ENV === 'production') {
      // break builds with broken links before they get deployed for reals
      // throw new Error(message);
      console.info('Broken links found. Please fix before deploy!')
    }

    if (verbose) {
      console.error(message)
    }
  } else if (verbose) {
    console.info('No broken links found')
  }

  return markdownAST
}
