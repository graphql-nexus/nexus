import React from 'react'
import styled from 'styled-components'
import * as CopyToClipboard from 'react-copy-to-clipboard'

interface CopyProps {
  text: string
}

type CopyButtonProps = CopyProps & React.ReactNode

const CopyButton = ({ text, children }: CopyButtonProps) => {
  const [copied, setCopied] = React.useState(false)
  let copyTimer: any

  const onCopyContent = () => {
    setCopied(true)
    copyTimer = window.setTimeout(() => setCopied(false), 500)
  }

  return (
    <CopyToClipboard text={text} onCopy={onCopyContent}>
      <CopyComponent>
        {copied && (
          <div className="indicator" style={{ color: 'var(--list-bullet-color)' }}>
            Copied
          </div>
        )}
        {children}
      </CopyComponent>
    </CopyToClipboard>
  )
}

export default CopyButton

const CopyComponent = styled.div`
  font-family: 'Open Sans';
  & {
    position: relative;
    cursor: pointer;
    display: inline-block;
  }
  @keyframes copying {
    0% {
      opacity: 0;
      transform: translate(-50%, 0);
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(-50%, 30px);
    }
  }
  .indicator {
    position: absolute;
    top: 20px;
    left: 0;
    transform: translate(-50%, 0);
    animation: copying 700ms linear;
  }
`
