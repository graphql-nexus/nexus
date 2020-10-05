import { urlGenerator } from './urlGenerator'

export const getParentTitle = (slug: string, allMdx?: any) => {
  const allContent =
    allMdx &&
    allMdx.edges &&
    allMdx.edges.map((mdx: any) => ({
      ...mdx.node.fields,
      title: mdx.node.frontmatter.title,
      staticLink: mdx.node.frontmatter.staticLink,
      codeStyle: mdx.node.frontmatter.codeStyle,
    }))
  allContent?.map((content: any) => {
    content.parentTitle = []
    const parts = content.slug.split('/')
    const slicedParts = parts.slice(
      1,
      parts[parts.length - 1] === 'index' ? parts.length - 2 : parts.length - 1
    )
    slicedParts.forEach((part: any) => {
      const parent = allContent.find((ac: any) => {
        const parentParts = ac.slug.split('/')
        return (
          parentParts[parentParts.length - 1] === 'index' &&
          parentParts[parentParts.length - 2] === part
        )
      })
      if (parent) {
        // const parts = parent.slug.split('/')
        // const topLevel = parts.length == 3 && parts[parts.length - 1] === 'index' ? true : false
        content.parentTitle.push({
          title: parent?.title,
          codeStyle: parent?.codeStyle,
          link: urlGenerator(parent.modSlug),
          // link: topLevel || parent.staticLink ? null : urlGenerator(parent.modSlug),
        })
      }
    })
  })
  const currentSlug = allContent.find((mdx: any) => mdx.modSlug === slug)
  return currentSlug ? currentSlug.parentTitle : []
}
