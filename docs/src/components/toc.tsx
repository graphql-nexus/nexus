import React from 'react'
import styled from 'styled-components'
import { stringify } from '../utils/stringify'

const ChapterTitle = styled.div`
  font-family: 'Open Sans';
  font-size: 1rem;
  font-weight: 600;
  line-height: 100%;
  letter-spacing: -0.01em;
  color: var(--main-font-color) !important;

  margin: 2rem 1rem 6px;
`

const TOCList = styled.ul`
  padding: 0;
  list-style-type: none;
  margin: 0 1rem 0;
  li {
    font-size: 0.875rem;
    padding: 0.5rem 0 0;
    line-height: 19px;
    font-weight: 800;

    ul {
      margin-left: 0.75rem;
    }

    // second level headings
    ul > li > a {
      font-weight: 400;
    }

    // makes inner headings slight less vertically spaced
    ul > li {
      padding-top: 0.3rem;
    }

    // third level headings
    ul > li > ul > li {
      list-style: circle inside;
      color: #718096;

      &:before {
        content: '';
        margin-left: -0.5rem;
      }
    }

    a {
      text-decoration: none;
      color: #718096 !important;
      &:hover {
        color: #1a202c !important;
      }
    }
  }
`

const TOCContainer = styled.div`
  position: sticky;
  top: 10px;
`

const TOC = ({ headings, tocDepth }: any) => {
  const navItems = (headings: any[], depth: number) => {
    return (
      <TOCList>
        {headings &&
          headings.map((heading: any, index: number) => (heading.url === undefined ? console.log(heading) : false) || (
            <li key={index}>
              <a
                href={heading.url?.replace(/inlinecode/g, '')}
                dangerouslySetInnerHTML={{
                  __html: stringify(heading.title),
                }}
              />
              {heading.items &&
                heading.items.length > 0 &&
                depth > 1 &&
                navItems(heading.items, depth - 1)}
            </li>
          ))}
      </TOCList>
    )
  }
  return navItems && navItems.length ? (
    <TOCContainer>
      <ChapterTitle>Content</ChapterTitle>
      {navItems(headings, tocDepth)}
    </TOCContainer>
  ) : null
}

export default TOC
