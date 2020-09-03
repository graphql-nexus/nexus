import React from 'react'
import Highlight, { defaultProps } from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/github'
import CopyButton from './copy'
import Copy from '../../icons/Copy'
import { stringify } from '../../utils/stringify'
import styled from 'styled-components'
import './prism/index.css'
require('./prism/prism-prisma')

interface CodeProps {
  copy?: boolean
}

type PreCodeProps = CodeProps & React.ReactNode

function cleanTokens(tokens: any[]) {
  const tokensLength = tokens.length
  if (tokensLength === 0) {
    return tokens
  }
  const lastToken = tokens[tokensLength - 1]

  if (lastToken.length === 1 && lastToken[0].empty) {
    return tokens.slice(0, tokensLength - 1)
  }
  return tokens
}

const propList = ['copy', 'bash-symbol']

const Code = ({ children, className, ...props }: PreCodeProps) => {
  let language = className && className.replace(/language-/, '')
  let breakWords = false

  if (propList.includes(language)) {
    breakWords = true
  }

  const code = stringify(children)

  const hasCopy = props['copy'] || language === 'copy'
  const hasNoLine = props['no-lines'] || language === 'no-lines'
  const hasTerminalSymbol = props['bash-symbol'] || language === 'bash-symbol'
  const tokenCopyClass = `${hasCopy ? 'has-copy-button' : ''} ${breakWords ? 'break-words' : ''}`

  return (
    <>
      <div className="gatsby-highlight pre-highlight">
        <Highlight {...defaultProps} code={code} language={language} theme={theme}>
          {({ className: blockClassName, style, tokens, getLineProps, getTokenProps }) => (
            <Pre className={blockClassName} style={style}>
              {(props['copy'] || language === 'copy') && (
                <AbsoluteCopyButton className="copy-button">
                  <CopyButton text={code}>
                    <Copy />
                  </CopyButton>
                </AbsoluteCopyButton>
              )}
              <code>
                {cleanTokens(tokens).map((line: any, i: number) => {
                  let lineClass = {
                    backgroundColor: '',
                    symbColor: '',
                  }

                  let isDiff = false
                  // let isHidden = false
                  let diffSymbol = ''

                  const diffBgColorMap: any = {
                    '+': 'var(--code-added-bg-color)',
                    '-': 'var(--code-deleted-bg-color)',
                    '|': 'var(--code-highlight-bg-color)',
                    '✎': 'var(--code-edit-bg-color)',
                  }

                  const symColorMap: any = {
                    '+': 'var(--code-added-color)',
                    '-': 'var(--code-deleted-color)',
                    '|': 'var(--code-highlight-color)',
                    '✎': 'var(--code-highlight-color)',
                  }

                  if (
                    (line[0] &&
                      line[0].content.length &&
                      (line[0].content[0] === '+' ||
                        line[0].content[0] === '-' ||
                        line[0].content[0] === '|' ||
                        line[0].content[0] === '✎')) ||
                    (line[0] &&
                      line[0].content === '' &&
                      line[1] &&
                      (line[1].content === '+' ||
                        line[1].content === '-' ||
                        line[1].content === '|' ||
                        line[1].content === '✎'))
                  ) {
                    diffSymbol =
                      line[0] && line[0].content.length ? line[0].content[0] : line[1].content
                    lineClass = {
                      backgroundColor: diffBgColorMap[diffSymbol],
                      symbColor: symColorMap[diffSymbol],
                    }
                    isDiff = true
                  }

                  const lineProps = getLineProps({ line, key: i })

                  lineProps.style = { ...lineClass }

                  return (
                    <Line key={line + i} {...lineProps}>
                      {hasTerminalSymbol && !isDiff && <LineNo>$</LineNo>}
                      {!hasTerminalSymbol && !isDiff && !hasNoLine && <LineNo>{i + 1}</LineNo>}
                      {isDiff && (
                        <LineNo style={{ color: lineClass.symbColor }}>
                          {diffSymbol !== '|' ? diffSymbol : i + 1}
                        </LineNo>
                      )}
                      <LineContent className={`${tokenCopyClass}`}>
                        {line.map((token: any, key: any) => {
                          if (isDiff) {
                            if (
                              (key === 0 || key === 1) &&
                              (token.content.charAt(0) === '+' ||
                                token.content.charAt(0) === '-' ||
                                token.content.charAt(0) === '|' || 
                                token.content.charAt(0) === '✎')
                            ) {
                              return (
                                <span
                                  {...getTokenProps({
                                    token: { ...token, content: token.content.slice(1) },
                                    key,
                                  })}
                                />
                              )
                            }
                          }
                          return <span {...getTokenProps({ token, key })} />
                        })}
                      </LineContent>
                    </Line>
                  )
                })}
              </code>
            </Pre>
          )}
        </Highlight>
      </div>
    </>
  )
}

export default Code

const AbsoluteCopyButton = styled.div`
  transition: opacity 100ms ease;
  position: absolute;
  top: 20px;
  right: 16px;
  z-index: 2;
  > div {
    right: -8px;
    top: -6px;
  }
`

const Pre = styled.pre`
  margin-top: 2rem;
  text-align: left;
  margin: 0 0 16px 0;
  padding: 2rem 1rem 1rem 1rem;
  overflow: auto;
  webkit-overflow-scrolling: touch;
`
const Line = styled.div`
  display: block;
`

const LineNo = styled.span`
  font-weight: 500;
  line-height: 24px;
  color: var(--code-linenum-color);
  display: inline-block;
  text-align: right;
  // padding-left: 1em;
  user-select: none;
  width: 24px;
`

const LineContent = styled.span`
  padding: 0 1em;
  &.break-words {
    display: inline-table;
    white-space: break-spaces;
    width: 95%;
  }

  &.token-line {
    line-height: 1.3rem;
    height: 1.3rem;
  }
`
