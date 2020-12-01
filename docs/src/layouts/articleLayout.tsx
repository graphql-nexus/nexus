import { RouterProps } from '@reach/router'
import * as React from 'react'
import { ArticleQueryData } from '../interfaces/Article.interface'
import Layout from '../components/layout'
import TopSection from '../components/topSection'
import PageBottom from '../components/pageBottom'
import SEO from '../components/seo'
import { graphql } from 'gatsby'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

interface LayoutContentProps {
  toc: any
  tocDepth?: number
  slug?: string
}

type ArticleLayoutProps = ArticleQueryData & RouterProps & LayoutContentProps

const ArticleLayout = ({ data, ...props }: ArticleLayoutProps) => {
  if (!data) {
    return null
  }
  const {
    mdx: {
      fields: { slug, modSlug },
      frontmatter: { title, metaTitle, metaDescription, toc, codeStyle },
      body,
      parent,
      tableOfContents,
    },
    site: {
      siteMetadata: { docsLocation },
    },
  } = data

  // TODO: Do not hardcode tocDepth here. Get it from the mdx headers or default to 1 or 2
  return (
    <Layout {...props} toc={toc || toc == null ? tableOfContents : []} tocDepth={2}>
      <SEO title={metaTitle || title} description={metaDescription || title} />
      <section className="top-section">
        <TopSection codeStyle={codeStyle} title={title} slug={modSlug} />
      </section>
      <MDXRenderer>{body}</MDXRenderer>
      <PageBottom editDocsPath={`${docsLocation}/${parent.relativePath}`} pageUrl={slug} />
    </Layout>
  )
}

export default ArticleLayout

export const query = graphql`
  query($id: String!) {
    site {
      siteMetadata {
        docsLocation
      }
    }
    mdx(fields: { id: { eq: $id } }) {
      fields {
        slug
        modSlug
      }
      body
      parent {
        ... on File {
          relativePath
        }
      }
      tableOfContents
      frontmatter {
        title
        metaTitle
        metaDescription
        toc
        codeStyle
      }
    }
  }
`
