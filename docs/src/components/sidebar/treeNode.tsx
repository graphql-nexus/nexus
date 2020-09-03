import React from 'react'
import styled from 'styled-components'
import ArrowRight from '../../icons/ArrowRight'
import ArrowDown from '../../icons/ArrowDown'
import Link from '../link'
import { urlGenerator } from '../../utils/urlGenerator'
import { useLocation } from '@reach/router'
import { withPrefix } from 'gatsby'

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0;
  &.has-border {
    border-left: 2px solid var(--border-color);
    margin-left: -12px;
  }
`

const ListItem = styled.li`
  font-size: 14px;
  line-height: 1.25;
  margin-bottom: 12px;
  position: relative;
  a {
    transition: color 150ms ease 0s;
    color: var(--code-inner-color) !important;
    text-decoration: none;
    vertical-align: middle;
    &:hover {
      color: var(--main-font-color) !important;
    }

    @media (min-width: 0px) and (max-width: 1024px) {
      color: var(--border-color) !important;
      &:hover {
        color: white !important;
      }
    }

    .tag {
      position: absolute;
      right: 0;
      color: var(--list-bullet-color);
      font-size: 14px;
      font-style: normal;
      font-weight: 600;
      background: var(--code-bgd-color);
      border-radius: 5px;
      padding: 2px 5px;
      &.small {
        font-size: 13px;
      }
      @media (min-width: 0px) and (max-width: 1024px) {
        background: var(--tag-media-color);
        color: var(--list-bullet-color);
      }
    }

    .item-collapser {
      background: transparent;
      position: absolute;
      left: -15px;
      top: 7px;
      padding: 0;
      border: 0;

      &.more-left {
        left: 10px;
      }

      .right,
      .down {
        transition: opacity 0.5s linear;
      }

      .right.open,
      .down.close {
        display: none;
        opacity: 0;
      }

      .right.close,
      .down.open {
        display: block;
        opacity: 1;
      }

      .down.open {
        margin-top: 2px;
      }

      &:hover,
      &:focus,
      &:active {
        outline: none;
      }
    }
  }
  .active-item {
    color: var(--nav-highlight-color) !important;
    font-weight: 700;
    @media (min-width: 0px) and (max-width: 1024px) {
      color: var(--border-color) !important;
    }
  }
  &.top-level {
    margin-top: 2rem;
    > a {
      font-size: 1rem;
      color: var(--main-font-color) !important;
      font-weight: 600;
      letter-spacing: -0.01em;
      @media (min-width: 0px) and (max-width: 1024px) {
        color: var(--main-bgd-color) !important;
      }
    }
    > ul {
      margin-top: 24px;
    }
  }
  &.bottom-level {
    margin-left: 20px;
  }
  &.static-link {
    margin-top: 24px;
  }
  &.static-link > a {
    color: var(--list-bullet-color) !important;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 12px;
    &:hover {
      color: var(--list-bullet-color) !important;
    }
  }
  &.last-level {
    padding-left: 24px;
    // &.more-padding {
    //   padding-left: 30px;
    // }
  }
  .collapse-title {
    cursor: pointer;
    svg {
      transition: transform 0.2s ease;
    }
  }
`

const TreeNode = ({
  className = '',
  setCollapsed,
  collapsed,
  url,
  slug,
  title,
  items,
  label,
  topLevel,
  staticLink,
  duration,
  experimental,
  lastLevel,
  hidePage,
  codeStyle,
}: any) => {
  const isCollapsed = collapsed[label]
  const collapse = () => {
    Object.keys(collapsed).map(lbl => {
      if (lbl !== label) {
        collapsed[lbl] = collapsed[lbl] == false ? (collapsed[lbl] = true) : collapsed[lbl]
      }
    })
    setCollapsed(label, false)
  }
  const location = useLocation()

  const justExpand = (e: any) => {
    setCollapsed(label, true)
    e.preventDefault()
    e.stopPropagation()
  }

  const hasChildren = items.length !== 0
  const level = slug ? slug.split('/').indexOf(label) : ''

  const calculatedClassName = `${className || ''} ${topLevel ? 'top-level' : ''} ${
    staticLink ? 'static-link' : ''
  } ${lastLevel ? 'last-level' : ''} ${level > 2 ? 'more-padding' : ''}`

  items.sort((a: any, b: any) => {
    if (a.label < b.label) {
      return -1
    }
    if (a.label > b.label) {
      return 1
    }
    return 0
  })

  const hasExpandButton = title && hasChildren && !staticLink && !topLevel
  let hasBorder: boolean = false
  if (hasExpandButton) {
    items.map((item: any) => (item.lastLevel = true))
    hasBorder = true
  }

  // Fix for issue https://github.com/prisma/prisma2-docs/issues/161
  const [isOpen, setIsOpen] = React.useState('close')
  React.useEffect(() => {
    setIsOpen(isCollapsed ? 'close' : 'open')
  }, [isCollapsed])

  const isCurrent = location && slug && location.pathname.includes(urlGenerator(slug))

  return url === '/' ? null : (
    <ListItem className={calculatedClassName}>
      {title && label !== 'index' && !hidePage && (
        <Link
          to={staticLink || topLevel ? null : url}
          activeClassName="active-item"
          className={isCurrent ? 'active-item' : 'non-active'}
          id={withPrefix(url)}
        >
          {hasExpandButton ? (
            <span className="collapse-title" onClick={collapse}>
              <button
                aria-label="collapse"
                className={`item-collapser ${level > 2 ? 'more-left' : ''}`}
                onClick={justExpand}
              >
                {/* Fix for issue https://github.com/prisma/prisma2-docs/issues/161 */}
                <ArrowRight className={`right ${isOpen}`} />
                <ArrowDown className={`down ${isOpen}`} />
              </button>
              <span className={`${codeStyle ? 'inline-code' : ''}`}>{title}</span>
            </span>
          ) : (
            <span className={`${codeStyle ? 'inline-code' : ''}`}>{title}</span>
          )}
          {duration && <span className="tag">{duration}</span>}
          {experimental && <span className="tag small">Experimental</span>}
        </Link>
      )}

      {!isCollapsed && hasChildren ? (
        <List className={`${hasBorder ? 'has-border' : ''}`}>
          {items.map((item: any, index: number) => (
            <TreeNode
              key={item.url + index.toString()}
              setCollapsed={setCollapsed}
              collapsed={collapsed}
              {...item}
            />
          ))}
        </List>
      ) : null}
    </ListItem>
  )
}
export default TreeNode
