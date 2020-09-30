import React from 'react'
import { Link as GatsbyLink } from 'gatsby'
import isAbsoluteUrl from 'is-absolute-url'

interface LinkProps {
  to: string | null
  activeClassName?: string
  partiallyActive?: string
  getProps?: any
}

const Link = ({
  to,
  activeClassName,
  partiallyActive,
  getProps,
  ...props
}: LinkProps & React.ReactNode) =>
  !to || isAbsoluteUrl(to) ? (
    <a href={to} {...props}>
      {props.children}
    </a>
  ) : (
    <GatsbyLink
      to={to}
      activeClassName={activeClassName}
      partiallyActive={partiallyActive}
      getProps={getProps}
      {...props}
    />
  )

export default Link
