import React from 'react'
import styled from 'styled-components'
import { stringify } from '../utils/stringify'

const ChapterTitle = styled.div`
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: bold;
  font-size: .875rem;
  line-height: 100%;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: #1A202C !important;
  margin: 1rem 1rem 0;
`

const TOCList = styled.ul`
  padding: 0;
  list-style-type: none;
  margin: 0 1rem 0;
  li {
    font-size: .875rem;
    padding: 1rem 0 0;
    line-height: 19px;

    ul {
      margin-left: 0.75rem;
    }
    a {
      text-decoration: none;
      color: #718096 !important;
      &:hover {
        color: #1A202C !important;
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
          headings.map((heading: any, index: number) => (
            <li key={index}>
              <a
                href={heading.url.replace(/inlinecode/g, '')}
                dangerouslySetInnerHTML={{ __html: stringify(heading.title) }}
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
      <ChapterTitle>CONTENT</ChapterTitle>
      {navItems(headings, tocDepth || 1)}
    </TOCContainer>
  ) : null
}

export default TOC
