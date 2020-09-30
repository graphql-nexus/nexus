import React from 'react'
import styled from 'styled-components'

type TopBlockProps = React.ReactNode

const TopBlock = ({ children, ...props }: TopBlockProps) => {
  return <TopBlockWrapper {...props}>{children}</TopBlockWrapper>
}

export default TopBlock

const TopBlockWrapper = styled.div`
  background: var(--white-color);
  box-shadow: 0px 4px 8px rgba(47, 55, 71, 0.05), 0px 1px 3px rgba(47, 55, 71, 0.1);
  border-radius: 5px;
  padding: 2rem 40px;
  margin-top: -8px;
  border-top: 1px solid var(--border-color);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`
