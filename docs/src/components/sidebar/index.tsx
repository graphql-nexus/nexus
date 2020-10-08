import React from 'react'
import Tree from './tree'
import styled, { css } from 'styled-components'
import styledTS from 'styled-components-ts'
import { StickyContainer, Sticky } from 'react-sticky'
import { useAllArticlesQuery } from '../../hooks/useAllArticlesQuery'
import { AllArticles } from '../../interfaces/AllArticles.interface'
import config from '../../../config'

const SidebarContainer = styled.aside`
  width: 231px;
  margin: 0px 16px 0 -16px;
`

const Sidebar = styledTS<{ isSticky: boolean }>(styled.div)`
  margin: 0;
  overflow: auto;
  height: 100vh;
  ${({ isSticky }: any) =>
    isSticky &&
    css`
      max-height: 100vh;
    `};

  .tablet-only {
    display: none;
    
    justify-content: space-between;
    padding: 2rem 0;

    > ul {
      width: 50%;
      margin-right: 50px;

      &:last-of-type {
        border-left: 1px solid var(--code-inner-color);
        padding-left: 40px;
      }
    }

    @media (min-width: 768px) and (max-width: 1024px) {
      display:flex;    
    }
  }

  .mobile-only {
    display: none;
    @media only screen and (max-width: 767px) {
      display: flex;
      > ul {
        width: 100%;
      }
    }
  }
`

const List = styled.ul`
  list-style: none;
  padding: 0 7px 0 15px;
  margin: 0;
`
const paneRegex =
  config.sidebar.tablet_menu_split.length > 0
    ? new RegExp('\\b(' + config.sidebar.tablet_menu_split.join('|') + ')\\b', 'ig')
    : null
const getLeftPane = (allEdges: any) =>
  paneRegex ? allEdges.filter((edge: any) => !edge.node.fields.slug.match(paneRegex)) : allEdges
const getRightPane = (allEdges: any) =>
  paneRegex ? allEdges.filter((edge: any) => edge.node.fields.slug.match(paneRegex)) : []

const SidebarLayout = ({ isMobile }: any) => {
  const { allMdx }: AllArticles = useAllArticlesQuery()
  return !isMobile ? (
    <StickyContainer>
      <SidebarContainer>
        <Sticky topOffset={0}>
          {({ style, isSticky }: any) => (
            <Sidebar style={style} isSticky={isSticky} id="sidebar-container">
              <List>
                <Tree edges={allMdx.edges} />
              </List>
            </Sidebar>
          )}
        </Sticky>
      </SidebarContainer>
    </StickyContainer>
  ) : (
    <Sidebar>
      <div className="tablet-only">
        <List>
          <Tree edges={getLeftPane(allMdx.edges)} />
        </List>
        <List>
          <Tree edges={getRightPane(allMdx.edges)} />
        </List>
      </div>
      <div className="mobile-only">
        <List>
          <Tree edges={allMdx.edges} />
        </List>
      </div>
    </Sidebar>
  )
}

export default SidebarLayout
