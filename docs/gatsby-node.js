const path = require(`path`)

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `Mdx`) {
    const parent = getNode(node.parent)
    let value = parent.relativePath.replace(parent.ext, '')
    if (value === 'index') {
      value = ''
    }

    createNodeField({
      node,
      name: `slug`,
      value: `/${value}`,
    })
    createNodeField({
      node,
      name: 'id',
      value: node.id,
    })
    createNodeField({
      node,
      name: 'modSlug',
      value: `/${value.replace('/index', '')}`,
    })
  }
}

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions

  return new Promise((resolve, reject) => {
    graphql(`
      {
        allMdx {
          edges {
            node {
              fields {
                slug
                id
                modSlug
              }
              frontmatter {
                title
                metaTitle
                metaDescription
              }
              body
              parent {
                ... on File {
                  relativePath
                }
              }
            }
          }
        }
      }
    `).then(result => {
      result.data.allMdx.edges.forEach(({ node }) => {
        createPage({
          path: node.fields.modSlug ? node.fields.modSlug.replace(/\d+-/g, '') : '/',
          component: path.resolve(`./src/layouts/articleLayout.tsx`),
          context: {
            id: node.fields.id,
            seoTitle: node.frontmatter.metaTitle || node.frontmatter.title,
            seoDescription: node.frontmatter.metaDescription || node.frontmatter.title,
          },
        })
      })
      resolve()
    })
  })
}

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      alias: {
        $components: path.resolve(__dirname, 'src/components'),
        buble: '@philpl/buble', // to reduce bundle size
      },
    },
  })
}
