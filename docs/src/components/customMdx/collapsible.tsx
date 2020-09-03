import React from 'react'
import styled from 'styled-components'
import ArrowRight from '../../icons/ArrowRight'

type CollapseProps = React.ReactNode
let index = 0

const getRemainingChildren = (children: any) =>
  children.filter((child: any) => !(child.props && child.props.originalType === 'summary'))

const CollapseBox = ({ children, ...props }: CollapseProps) => {
  const titleChild =
    children && children.find((child: any) => child.props && child.props.originalType === 'summary')
  const title = titleChild && titleChild.props.children
  return (
    <Wrapper {...props}>
      <Tab>
        <Input id={`tab-${++index}`} type="checkbox" name="tab" />
        <StyledArrow />
        <Label htmlFor={`tab-${index}`}>{title}</Label>
        <TabContent className="tab-content">{getRemainingChildren(children)}</TabContent>
      </Tab>
    </Wrapper>
  )
}

export default CollapseBox

const Wrapper = styled.div`
  padding-bottom: 24px;
`

const Tab = styled.div`
  position: relative;
  overflow: hidden;
  .tab-content {
    transition: max-height 0.35s;
  }
  &:before {
    content: '';
    position: absolute;
    width: 8px;
    height: 100%;
    left: 0px;
    background: var(--code-bgd-color);
    border-radius: 5px;
  }
  p {
    margin-top: 8px;
  }
`

const Label = styled.label`
  position: relative;
  display: block;
  color: var(--selection-bgd-color);
  font-weight: 600;
  line-height: 1.5;
  padding-left: 36px;
  cursor: pointer;
`

const TabContent = styled.div`
  max-height: 0;
  overflow: hidden;
  color: var(--grey-color);
  transition: max-height 0.35s, padding 0.35s;
  padding-left: 36px;
  padding-bottom: 0;
`

const Input = styled.input`
  position: absolute;
  opacity: 0;
  z-index: -1;
  &:checked ~ .tab-content {
    max-height: 2000px;
    padding-bottom: 8px;
  }
`

const StyledArrow = styled(ArrowRight)`
  position: absolute;
  left: 18px;
  top: 8px;
  transition: transform 0.15s;
  input:checked + & {
    transform: rotate(90deg);
  }
`
