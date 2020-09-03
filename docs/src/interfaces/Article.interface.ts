export interface ArticleFields {
  slug: string
  modSlug: string
}

export interface ArticleFrontmatter {
  title: string
  metaTitle?: string
  metaDescription?: string
  // langSwitcher?: string[]
  // dbSwitcher?: string[]
  staticLink?: boolean
  duration?: string
  experimental?: boolean
  toc?: boolean
  hidePage?: boolean
  codeStyle?: boolean
}

export interface ArticleData {
  mdx: {
    fields: ArticleFields
    tableOfContents: TableOfContents
    body: string
    parent: any
    frontmatter: ArticleFrontmatter
  }
  site: {
    siteMetadata: {
      docsLocation: string
    }
  }
}

export interface ArticleQueryData {
  data: ArticleData
}

export interface Fields {
  fields: ArticleFields
}

export interface TableOfContents {
  items: {
    url: string
    title: string
  }[]
}
