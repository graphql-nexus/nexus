import React from 'react'
import styled from 'styled-components'

type CodeWithResultProps = React.ReactNode

const CodeWithResult = ({ children }: CodeWithResultProps) => {
  const [showResult, setShowResult] = React.useState(false)
  const cmd =
    children && children.filter((child: any) => child.props && child.props.mdxType === 'Cmd')
  const result =
    children && children.filter((child: any) => child.props && child.props.mdxType === 'CmdResult')

  const toggleResult = () => setShowResult(!showResult)

  return (
    <Wrapper>
      <div className="cmd">{cmd}</div>
      <div className="result">
        <div onClick={toggleResult} className="show-btn">
          {showResult ? `Hide result` : `Show result`}
        </div>
        {showResult && <div className="result-code">{result}</div>}
      </div>
    </Wrapper>
  )
}

export default CodeWithResult

const Wrapper = styled.div`
  margin-top: 2rem;
  .cmd .pre-highlight pre {
    border-radius: 8px 8px 0px 0px;
  }

  .result {
    background: var(--code-result-bg-color);
    border-radius: 0px 0px 8px 8px;
    margin-top: -13px;

    pre {
      background: var(--code-result-bg-color) !important;
      border-radius: 0px 0px 8px 8px;
      margin-top: 0;
    }

    .show-btn {
      font-family: Open Sans;
      font-style: normal;
      font-weight: 600;
      font-size: 12px;
      line-height: 100%;
      letter-spacing: 0.01em;
      color: var(--code-inner-color);
      height: 24px;
      display: flex;
      padding-left: 1rem;
      align-items: center;
      cursor: pointer;
    }
  }
`
