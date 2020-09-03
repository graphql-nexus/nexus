export function stringify(children: any): string {
  if (typeof children === 'string') {
    return children
  }

  if (typeof children === 'undefined') {
    return ''
  }

  if (children === null) {
    return ''
  }

  if (children.props && children.props.children) {
    children = children.props.children
  }
  if (children.props && children.props.children) {
    children = children.props.children
  }

  /**
   * Necessary because now the pointer changed!!!!
   */
  if (typeof children === 'string') {
    return children
  }

  if (Array.isArray(children)) {
    return children
      .map(el => {
        if (typeof el === 'string') {
          return el
        } else {
          return stringify(el)
        }
      })
      .join('')
  }

  return ''
}
