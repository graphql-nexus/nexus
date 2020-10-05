import { RouterProps } from '@reach/router'
import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { useLayoutQuery } from '../hooks/useLayoutQuery'
import Header from './header'
import Footer from './footer'
import { MDXProvider } from '@mdx-js/react'
import customMdx from '../components/customMdx'
import './layout.css'
import Sidebar from './sidebar'
// import { StickyContainer } from 'react-sticky';

// interface ThemeProps {
//   colorPrimary: string
// }

// const theme: ThemeProps = {
//   colorPrimary: '#663399',
// }

type LayoutProps = React.ReactNode & RouterProps

const Layout: React.FunctionComponent<LayoutProps> = ({ children }) => {
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
      </Wrapper>
      <Footer footerProps={footer} />
    </MDXProvider>
    // </ThemeProvider>
  )
}

export default Layout
