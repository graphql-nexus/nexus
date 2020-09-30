import React from 'react'
import { connectSearchBox } from 'react-instantsearch-dom'
import styled from 'styled-components'
import SearchPic from '../../icons/Search'
import Clear from '../../icons/Clear'

const SearchBoxDiv = styled.div`
  width: 208px;
  form {
    position: relative;
    z-index: 100001;
    // display: flex;
    // align-items: center;

    button.ais-SearchBox-submit {
      display: none;
    }
    button.ais-SearchBox-reset {
      background: transparent;
      border: transparent;
      outline: none;
    }

    input {
      width: 100%;
      background: var(--white-color);
      box-shadow: 0px 4px 8px rgba(60, 45, 111, 0.1), 0px 1px 3px rgba(60, 45, 111, 0.15);
      border-radius: 5px;
      padding: 0.6rem 2.5rem;
      font-family: Open Sans;
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      line-height: 100%;
      border-width: 0;

      &::placeholder {
        content: 'Search';
        color: var(--list-bullet-color);
        opacity: 1; /* Firefox */
      }
    }

    input[type='search']::-webkit-search-decoration,
    input[type='search']::-webkit-search-cancel-button,
    input[type='search']::-webkit-search-results-button,
    input[type='search']::-webkit-search-results-decoration {
      -webkit-appearance: none;
    }
  }

  @media (min-width: 0px) and (max-width: 1024px) {
    flex: 1;
  }
`

const SearchIcon = styled(SearchPic)`
  position: absolute;
  left: 12px;
  top: 12px;
  width: 1em;
  pointer-events: none;
  z-index: 100001;
`

const ClearIcon = styled(Clear)`
  position: absolute;
  right: 24px;
  top: 15px;
  cursor: pointer;
`

const DEBOUNCE_DELAY = 500
const focusShortcuts = ['s', 191]

const SearchBox = ({ refine, onFocus, currentRefinement, ...rest }: any) => {
  const [value, setValue] = React.useState(currentRefinement)
  const timeoutId = React.useRef(null)
  const inputEl = React.useRef(null)

  const onChange = (e: any) => {
    const { value: newValue } = e.target

    // After the user manually cleared the input, call `refine` without waiting so that the search
    // closes instantly.
    if (newValue === '') {
      return clearInput()
    }

    // Otherwise, debounce the search to avoid triggering many queries at once, which could also
    // make the UI freeze.
    window.clearTimeout(timeoutId.current)
    timeoutId.current = window.setTimeout(() => refine(newValue), DEBOUNCE_DELAY)
    setValue(newValue)
  }

  const clearInput = () => {
    window.clearTimeout(timeoutId.current)
    setValue('')
    refine('')
  }

  // Focus shortcuts on keydown
  const onKeyDown = (e: any) => {
    const shortcuts = focusShortcuts.map(key =>
      typeof key === 'string' ? key.toUpperCase().charCodeAt(0) : key
    )

    const elt = e.target || e.srcElement
    const tagName = elt.tagName
    if (
      elt.isContentEditable ||
      tagName === 'INPUT' ||
      tagName === 'SELECT' ||
      tagName === 'TEXTAREA'
    ) {
      // already in an input
      return
    }

    const which = e.which || e.keyCode
    if (shortcuts.indexOf(which) === -1) {
      // not the right shortcut
      return
    }

    inputEl.current.focus()
    e.stopPropagation()
    e.preventDefault()
  }

  const onSubmit = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    inputEl.current.blur()

    return false
  }

  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
  }, [])

  return (
    <SearchBoxDiv>
      <form onSubmit={onSubmit}>
        <input
          ref={inputEl}
          type="text"
          placeholder="Search"
          aria-label="Search"
          onChange={onChange}
          onFocus={onFocus}
          value={value}
          {...rest}
        />
        <SearchIcon />
        {value !== '' && <ClearIcon onClick={clearInput} />}
      </form>
    </SearchBoxDiv>
  )
}

const CustomSearchBox = connectSearchBox(SearchBox)
export default CustomSearchBox
