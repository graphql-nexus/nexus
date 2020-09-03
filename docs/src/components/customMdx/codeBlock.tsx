import React from 'react'
import styled from 'styled-components'

interface CodeProps {
  languages?: string[]
}

type CodeBlockProps = CodeProps & React.ReactNode

const CodeBlock = ({ languages, children }: CodeBlockProps) => {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const child: any = React.Children.toArray(children)[activeIndex]
  const code = child && child.props && child.props.children

  return (
    <Wrapper>
      {languages && Array.isArray(languages) && (
        <Tabs>
          {languages.map((lang, index) => {
            const setCurrentActive = () => setActiveIndex(index)
            return (
              <div
                className={`tab ${index === activeIndex ? 'active' : ''}`}
                key={lang}
                data-index={`${index}`}
                onClick={setCurrentActive}
              >
                {lang}
              </div>
            )
          })}
        </Tabs>
      )}
      {code}
    </Wrapper>
  )
}

export default CodeBlock

const Tabs = styled.div`
  display: flex;
  .tab {
    margin-right: 10px;
    color: var(--grey-bg-color);
    cursor: pointer;
  }

  .tab.active {
    font-weight: 600;
    color: var(--main-font-color);
  }
`
const Wrapper = styled.div`
  margin-top: 2rem;
  position: relative;
`
