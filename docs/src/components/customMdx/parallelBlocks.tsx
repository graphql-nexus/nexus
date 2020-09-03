import React from 'react'
import styled from 'styled-components'

type CodeBlockProps = React.ReactNode

const ParallelBlocks = ({ children }: CodeBlockProps) => {
  const blockContent =
    children && children.filter((child: any) => child.props && child.props.originalType === 'block')
  return (
    <Wrapper>
      {blockContent.map((block: any, i: number) => (
        <Block key={i}>
          <div className="blockHeading">{block.props.content}</div>
          <div className="blockContent">{block.props.children}</div>
        </Block>
      ))}
    </Wrapper>
  )
}

export default ParallelBlocks

const Block = styled.div`
  flex: 1 1 0px;
  margin-right: 0.5rem;
  &:last-of-type {
    margin: 0;
  }
  .blockHeading {
    font-weight: 600;
    font-size: 14px;
    svg {
      margin-right: 8px;
    }
  }

  .blockContent {
    height: calc(100% - 2em);

    .pre-highlight,
    pre {
      height: 100%;
    }
  }

  @media (max-width: 767px) and (min-width: 0px) {
    .pre-highlight {
      margin: 0;
    }
    &:first-of-type .pre-highlight {
      margin-right: 0;
      margin-left: -24px;
    }
    &:last-of-type .pre-highlight {
      margin-left: 0;
      margin-right: -24px;
    }
  }
`
const Wrapper = styled.div`
  display: flex;
  margin-top: 2rem;
`
