import React from 'react'
import styled from 'styled-components'
import ArrowRight from '../../icons/ArrowRight'
// import { darken } from 'polished'
import withProps from 'styled-components-ts'
import { useLocation } from '@reach/router'
import { withPrefix } from 'gatsby'
import isAbsoluteUrl from 'is-absolute-url'

import * as path from 'path'

export interface ButtonProps {
  href?: string
  target?: string
  block?: boolean
  color?: ButtonColor
  disabled?: boolean
  arrow?: boolean
  children?: any
  onClick?: any
  arrowLeft?: boolean
}

type ButtonColor = 'red' | 'green' | 'grey' | 'grey-bg' | 'dark'
const colorMap = {
  red: '--white-color',
  green: '--white-color',
  grey: '--grey-color',
  'grey-bg': '--white-color',
  dark: '--white-color',
}

const backgroundColorMap: any = {
  red: '--red-color',
  green: '--red-color',
  grey: '--white-color',
  'grey-bg': '--grey-bg-color',
  dark: '--dark-color',
}

export const ButtonWrapper = withProps<ButtonProps>(styled.a)`
    padding: 11px 14px;
    margin-right: 10px;
    display: inline-flex;
    align-items: center;
    ${p => (p.block ? 'width: 100%;' : '')}
    border: none;
    text-decoration: none;
    height: 40px;
    font-size: 1rem;
    box-sizing: border-box;
    outline: none;
    opacity: ${p => (p.disabled ? '0.2' : 1)};
    text-transform: uppercase;
    letter-spacing: 0.4px;
    background: var(${p => backgroundColorMap[p.color || 'green']});
    color: var(${p => colorMap[p.color || 'green']}) !important;
    line-height: 1;
    font-size: 14px;
    font-weight: 700;
    cursor: ${p => (p.disabled ? 'default' : 'pointer')};
    pointer-events: ${p => (p.disabled ? 'none' : 'all')};
    border-radius: 6px;
    transition: color 150ms ease 0s, background 150ms ease 0s, transform 100ms ease 0s;
    white-space: nowrap;
    word-break: keep-all;
    max-width: 100%;
    overflow-x: auto;
    margin-bottom: 0.5rem;
  `
//     &:hover {
//       background: ${p => darken(0.04, backgroundColorMap[p.color || 'green'])};
//     }
//     &:focus {
//       background: ${p => darken(0.07, backgroundColorMap[p.color || 'green'])};
//     }

const getAbsPath = (href: any, location: any) => {
  return withPrefix(
    path
      .resolve(
        location.pathname
          .replace('/docs', '')
          .replace('docs', '')
          .replace(/\/$/, '')
          .split(path.sep)
          .slice(0, -1)
          .join(path.sep) || '/',
        href
      )
      .replace(/\/?(\?|#|$)/, '/$1')
  )
}
const ButtonLink = ({ href, ...props }: ButtonProps) => {
  const location = useLocation()
  const newHref = isAbsoluteUrl(href) ? href : getAbsPath(href, location)
  return (
    <ButtonWrapper href={newHref} {...props}>
      {props.arrowLeft && <StyledArrowLeft />}
      {props.children}
      {props.arrow && <StyledArrow />}
    </ButtonWrapper>
  )
}

const StyledArrow = styled(ArrowRight)`
  margin-left: 12px;
`

const StyledArrowLeft = styled(ArrowRight)`
  margin-right: 12px;
  transform: rotate(180deg);
`

export default ButtonLink
