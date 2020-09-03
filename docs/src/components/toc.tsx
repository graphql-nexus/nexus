import React from 'react'
import styled from 'styled-components'
import { stringify } from '../utils/stringify'

const ChapterTitle = styled.h1`
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: bold;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: var(--list-bullet-color);
`

const TOC = ({ headings }: any) => {
  let navItems: any[] = []
  navItems =
    headings &&
    headings.map((heading: any, index: number) => {
      return (
        <li key={index}>
          <a href={heading.url} dangerouslySetInnerHTML={{ __html: stringify(heading.title) }}/>
        </li>
      )
    })
  return navItems && navItems.length ? (
    <div>
      <ChapterTitle>CONTENT</ChapterTitle>
      <ul className="list">{navItems}</ul>
    </div>
  ) : null
}

export default TOC
