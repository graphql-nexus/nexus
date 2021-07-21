const MAX_ARRAY_LENGTH = 10
const MAX_RECURSIVE_DEPTH = 2

/** Used to print values in error messages. */
export function inspect(value: unknown): string {
  return formatValue(value, [])
}

function formatValue(value: unknown, seenValues: ReadonlyArray<unknown>): string {
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value)
    case 'function':
      return value.name ? `[function ${value.name}]` : '[function]'
    case 'object':
      return formatObjectValue(value, seenValues)
    default:
      return String(value)
  }
}

function formatObjectValue(value: object | null, previouslySeenValues: ReadonlyArray<unknown>): string {
  if (value === null) {
    return 'null'
  }

  if (previouslySeenValues.includes(value)) {
    return '[Circular]'
  }

  const seenValues = [...previouslySeenValues, value]

  if (isJSONable(value)) {
    const jsonValue = value.toJSON()

    // check for infinite recursion
    if (jsonValue !== value) {
      return typeof jsonValue === 'string' ? jsonValue : formatValue(jsonValue, seenValues)
    }
  } else if (Array.isArray(value)) {
    return formatArray(value, seenValues)
  }

  return formatObject(value, seenValues)
}

function isJSONable(value: any): value is { toJSON: () => unknown } {
  return typeof value.toJSON === 'function'
}

function formatObject(object: object, seenValues: ReadonlyArray<unknown>): string {
  const entries = Object.entries(object)
  if (entries.length === 0) {
    return '{}'
  }

  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return '[' + getObjectTag(object) + ']'
  }

  const properties = entries.map(([key, value]) => key + ': ' + formatValue(value, seenValues))
  return '{ ' + properties.join(', ') + ' }'
}

function formatArray(array: ReadonlyArray<unknown>, seenValues: ReadonlyArray<unknown>): string {
  if (array.length === 0) {
    return '[]'
  }

  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return '[Array]'
  }

  const len = Math.min(MAX_ARRAY_LENGTH, array.length)
  const remaining = array.length - len
  const items = []

  for (let i = 0; i < len; ++i) {
    items.push(formatValue(array[i], seenValues))
  }

  if (remaining === 1) {
    items.push('... 1 more item')
  } else if (remaining > 1) {
    items.push(`... ${remaining} more items`)
  }

  return '[' + items.join(', ') + ']'
}

function getObjectTag(object: object): string {
  const tag = Object.prototype.toString
    .call(object)
    .replace(/^\[object /, '')
    .replace(/]$/, '')

  if (tag === 'Object' && typeof object.constructor === 'function') {
    const name = object.constructor.name
    if (typeof name === 'string' && name !== '') {
      return name
    }
  }

  return tag
}

export function invariant(condition: unknown, message?: string): asserts condition {
  const booleanCondition = Boolean(condition)
  // istanbul ignore else (See transformation done in './resources/inlineInvariant.js')
  if (!booleanCondition) {
    throw new Error(message != null ? message : 'Unexpected invariant triggered.')
  }
}

/**
 * Produces the value of a block string from its parsed raw value, similar to CoffeeScript's block string,
 * Python's docstring trim or Ruby's strip_heredoc.
 *
 * This implements the GraphQL spec's BlockStringValue() static algorithm.
 *
 * @internal
 */
export function dedentBlockStringValue(rawString: string): string {
  // Expand a block string's raw value into independent lines.
  const lines = rawString.split(/\r\n|[\n\r]/g)

  // Remove common indentation from all lines but first.
  const commonIndent = getBlockStringIndentation(rawString)

  if (commonIndent !== 0) {
    for (let i = 1; i < lines.length; i++) {
      lines[i] = lines[i].slice(commonIndent)
    }
  }

  // Remove leading and trailing blank lines.
  let startLine = 0
  while (startLine < lines.length && isBlank(lines[startLine])) {
    ++startLine
  }

  let endLine = lines.length
  while (endLine > startLine && isBlank(lines[endLine - 1])) {
    --endLine
  }

  // Return a string of the lines joined with U+000A.
  return lines.slice(startLine, endLine).join('\n')
}

function isBlank(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    if (str[i] !== ' ' && str[i] !== '\t') {
      return false
    }
  }

  return true
}

/** @internal */
export function getBlockStringIndentation(value: string): number {
  let isFirstLine = true
  let isEmptyLine = true
  let indent = 0
  let commonIndent = null

  for (let i = 0; i < value.length; ++i) {
    switch (value.charCodeAt(i)) {
      case 13: //  \r
        if (value.charCodeAt(i + 1) === 10) {
          ++i // skip \r\n as one symbol
        }
      // falls through
      case 10: //  \n
        isFirstLine = false
        isEmptyLine = true
        indent = 0
        break
      case 9: //   \t
      case 32: //  <space>
        ++indent
        break
      default:
        if (isEmptyLine && !isFirstLine && (commonIndent === null || indent < commonIndent)) {
          commonIndent = indent
        }
        isEmptyLine = false
    }
  }

  return commonIndent ?? 0
}

/**
 * Print a block string in the indented block form by adding a leading and trailing blank line. However, if a
 * block string starts with whitespace and is a single-line, adding a leading blank line would strip that whitespace.
 *
 * @internal
 */
export function printBlockString(value: string, preferMultipleLines: boolean = false): string {
  const isSingleLine = !value.includes('\n')
  const hasLeadingSpace = value[0] === ' ' || value[0] === '\t'
  const hasTrailingQuote = value[value.length - 1] === '"'
  const hasTrailingSlash = value[value.length - 1] === '\\'
  const printAsMultipleLines = !isSingleLine || hasTrailingQuote || hasTrailingSlash || preferMultipleLines

  let result = ''
  // Format a multi-line block quote to account for leading space.
  if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
    result += '\n'
  }
  result += value
  if (printAsMultipleLines) {
    result += '\n'
  }

  return '"""' + result.replace(/"""/g, '\\"""') + '"""'
}
