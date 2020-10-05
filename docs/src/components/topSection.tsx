import * as React from 'react'
import styled from 'styled-components'
import TOC from './toc'
import ParentTitle from './parentTitleComp'

const TopSectionWrapper = styled.div`
  position: relative;
  hr.bigger-margin {
    margin-top: 3.5rem;
    margin-bottom: 4rem;
  }
  .tech-switch-block {
    position: relative;
  }
`

const MainTitle = styled.h1`
  font-family: 'Montserrat';
  font-size: 2rem;
  font-style: normal;
  font-weight: bold;
  letter-spacing: -0.02em;
  color: var(--main-font-color);
  margin: 0;
  margin-top: 4px;
  &.inline-code {
    font-size: 2rem;
    padding: 0px 0.2em;
    line-height: 3rem;
  }
  @media only screen and (max-width: 767px) {
    font-size: 24px;
  }
`

const TopSection = ({ title, slug, toc, codeStyle }: any) => {
  return (
    <TopSectionWrapper>
      <ParentTitle slug={slug} />
      <MainTitle className={`${codeStyle ? 'inline-code': ''}`}>{title}</MainTitle>
      {toc.items && (
        <div className="tech-switch-block">
          <hr />
        </div>
      )}
      {toc && toc.items && toc.items.length > 0 && <TOC headings={toc.items} />}
    </TopSectionWrapper>
  )
}

export default TopSection
