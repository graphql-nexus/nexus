import { MDXProvider } from '@mdx-js/react'
import { RouterProps } from '@reach/router'
import * as React from 'react'
import { stickWhenNeeded } from '../utils/stickWhenNeeded'
import styled from 'styled-components'
import customMdx from '../components/customMdx'
import { useLayoutQuery } from '../hooks/useLayoutQuery'
import Footer from './footer'
import Header from './header'
import './layout.css'
import Sidebar from './sidebar'
import TOC from './toc'
// import { StickyContainer } from 'react-sticky';

// interface ThemeProps {
//   colorPrimary: string
// }

// const theme: ThemeProps = {
//   colorPrimary: '#663399',
// }

interface LayoutContentProps {
  toc: any
  tocDepth?: number
  slug?: string
}

type LayoutProps = React.ReactNode & RouterProps & LayoutContentProps

const Layout: React.FunctionComponent<LayoutProps> = ({ children, toc, tocDepth }) => {
  const { site } = useLayoutQuery()
  const { header, footer } = site.siteMetadata

  const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    padding: 0 10px;
  `

  const Content = styled.article`
    max-width: 880px;
    width: 880px;
    margin: -80px 0 1rem;
    position: relative;
    z-index: 100;
    @media (min-width: 0px) and (max-width: 1024px) {
      margin: 0;
      width: 100%;
      max-width: 100%;
    }
  `

  const MaxWidth = styled.div`
    > section {
      background: var(--white-color);
      box-shadow: 0px 4px 8px rgba(47, 55, 71, 0.05), 0px 1px 3px rgba(47, 55, 71, 0.1);
      border-radius: 5px;
      margin-top: 1rem;
      padding: 2rem 40px;
      &.top-section {
        padding-top: 40px;
      }
      @media (min-width: 0px) and (max-width: 1024px) {
        margin-top: 0.5rem;
      }
      @media (min-width: 0px) and (max-width: 767px) {
        padding: 24px;
        &.top-section {
          padding-top: 24px;
        }
      }
    }
  `

  const NotMobile = styled.section`
    display: flex;
    @media (min-width: 0px) and (max-width: 1024px) {
      display: none;
    }
  `

  const TOCContainer = styled.div`
    position: sticky;
    top: 0;
    padding-bottom: 5px;
    width: 280px;
    // 150px === size of the header
    height: calc(100vh - 150px);
    overflow: scroll;

    @media (min-width: 0px) and (max-width: 1024px) {
      display: none;
    }

    &.fixed {
      height: 100vh !important;
    }
  `

  React.useEffect(() => {
    stickWhenNeeded('#toc-container')
  })

  return (
    // <ThemeProvider theme={theme}>
    <MDXProvider components={customMdx}>
      <Header headerProps={header} />
      <Wrapper>
        <NotMobile>
          <Sidebar isMobile={false} />
        </NotMobile>
        <Content>
          <MaxWidth>{children}</MaxWidth>
        </Content>
        <TOCContainer id="toc-container">
          {toc && toc.items && toc.items.length > 0 && (
            <TOC headings={toc.items} tocDepth={tocDepth} location={location} />
          )}
        </TOCContainer>
      </Wrapper>
      <Footer footerProps={footer} />
    </MDXProvider>
    // </ThemeProvider>
  )
}

export default Layout
