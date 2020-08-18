import { urlGenerator } from './urlGenerator'
import { ArticleFields, ArticleFrontmatter } from '../interfaces/Article.interface'

interface TreeNode {
  node: {
    fields: ArticleFields
    frontmatter: ArticleFrontmatter
  }
}

const getCollpaseState = (part: string, location: any) => {
  return !(location && location.pathname.includes(urlGenerator(part)))
}

// TODO::Simplify the function
export const calculateTreeData = (edges: any, defaultCollapsed: any, location: any) => {
  const tree = edges.reduce(
    (
      accu: any,
      {
        node: {
          fields: { slug, modSlug },
          frontmatter: {
            title,
            staticLink,
            duration,
            experimental,
            // dbSwitcher,
            // langSwitcher,
            hidePage,
            codeStyle
          },
        },
      }: TreeNode
    ) => {
      const parts = slug.split('/')
      const topLevel = parts.length == 3 && parts[parts.length - 1] === 'index' ? true : false
      let { items: prevItems } = accu
      const slicedParts = parts.slice(1, -1)
      // const newParams = `${langSwitcher ? `${langSwitcher[0]}${dbSwitcher ? '-' : ''}` : ''}${
      //   dbSwitcher ? `${dbSwitcher[0]}` : ''
      // }`
      for (const part of slicedParts) {
        let tmp = prevItems && prevItems.find(({ label }: any) => label == part)
        if (tmp) {
          if (!tmp.items) {
            tmp.items = []
          }
        } else {
          tmp = {
            label: part,
            items: [],
            topLevel,
            experimental,
            staticLink,
          }
          prevItems.push(tmp)
        }
        if (parts[parts.length - 1] === 'index' && parts[parts.length - 2] === part) {
          tmp.url = `${urlGenerator(modSlug)}`
          tmp.slug = slug
          tmp.title = title
          tmp.staticLink = staticLink
          tmp.duration = duration
          tmp.experimental = experimental
          tmp.topLevel = topLevel
          tmp.hidePage = hidePage
          tmp.codeStyle = codeStyle
        }
        if (defaultCollapsed && location) {
          defaultCollapsed[part.toLowerCase()] =
            tmp.topLevel || tmp.staticLink ? null : getCollpaseState(modSlug, location)
        }

        prevItems = tmp.items
      }
      const slicedLength = parts.length - 1
      const existingItem = prevItems.find(({ label }: any) => label === parts[slicedLength])

      if (!existingItem) {
        prevItems.push({
          label: parts[slicedLength],
          url: `${urlGenerator(modSlug)}`,
          slug: slug,
          items: [],
          title,
          staticLink,
          duration,
          experimental,
          topLevel,
          hidePage,
          codeStyle
        })
      }

      return accu
    },
    { items: [] }
  )
  return tree
}
