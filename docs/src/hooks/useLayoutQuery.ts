import { graphql, useStaticQuery } from 'gatsby'
import { LayoutQueryData } from '../interfaces/Layout.interface'

export const useLayoutQuery = () => {
  const { site }: LayoutQueryData = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          # change siteMetaData in 'gatsby-config.js'
          title
          footer {
            logoLink
            title
            products {
              name
              link
            }
            community {
              name
              link
            }
            resources {
              name
              link
            }
            company {
              name
              link
            }
            newsletter {
              text
            }
            findus {
              twitterLink
              youtubeLink
              fbLink
              slackLink
              gitLink
            }
          }
          header {
            logoLink
            title
            links {
              name
              link
            }
          }
        }
      }
    }
  `)

  return { site }
}
