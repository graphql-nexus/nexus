import { ArticleFrontmatter } from './Article.interface'
import { ArticleFields } from './Article.interface'

export interface EdgeNode {
  node: {
    frontmatter: { [Property in keyof ArticleFrontmatter]: ArticleFrontmatter[Property] }
    fields: { [Property in keyof ArticleFields]: ArticleFields[Property] }
  }
}
