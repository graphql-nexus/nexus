import React, { useState } from 'react'
import { InstantSearch, Index, Hits, connectStateResults } from 'react-instantsearch-dom'
import algoliasearch from 'algoliasearch/lite'
import config from '../../../config'
import DocHit from './hitComps'
import styled from 'styled-components'
import Overlay from './overlay'
import CustomSearchBox from './input'

const HitsWrapper = styled.div`
  display: none;
  &.show {
    display: grid;
  }
  max-height: 85vh;
  overflow-y: scroll;
  overflow-x: hidden;
  z-index: 100002;
  -webkit-overflow-scrolling: touch;
  position: absolute;
  left: 230px;
  top: 0;
  max-width: 880px;
  width: 100vw;
  background: var(--white-color);
  box-shadow: 0px 4px 8px rgba(47, 55, 71, 0.05), 0px 1px 3px rgba(47, 55, 71, 0.1);
  border-radius: 5px;
  * {
    margin-top: 0;
    padding: 0;
  }
  ul {
    list-style: none;
    margin: 0;
  }
  .no-results,
  .loader {
    padding: 24px 40px;
  }
  @media (min-width: 0px) and (max-width: 1024px) {
    left: 0;
    top: 40px;
    max-width: 100%;
    border-top: 1px solid var(--border-color);
    border-top-right-radius: 0;
    border-top-left-radius: 0;
  }
`

const indexName = config.header.search.indexName
const searchClient = algoliasearch(
  config.header.search.algoliaAppId,
  config.header.search.algoliaSearchKey
)

const getHits = (children: any, res: any) => {
  const allHits = res.hits
  const newHits = allHits
    .filter((h: any) => h._distinctSeqID == 0)
    .map((x: any) => ({
      ...x,
      moreCount: 0,
    }))
  allHits.map((h: any) => {
    const first = newHits.find((firstG: any) => firstG.slug == h.slug)
    if (first) {
      first.moreCount++
    }
  })
  res.hits = newHits
  return children
}
const Results = connectStateResults(
  ({ isSearchStalled, searchState: state, searchResults: res, children }: any) =>
    (isSearchStalled ? <div className="loader">Searching...</div> : null) ||
    (res && res.nbHits > 0 ? (
      getHits(children, res)
    ) : (
      <div className="no-results">No results for '{state.query}'</div>
    ))
)

export default function Search({ hitsStatus }: any) {
  const [query, setQuery] = useState(``)
  const [showHits, setShowHits] = React.useState(false)

  const hideSearch = () => setShowHits(false)

  const showSearch = () => setShowHits(true)

  React.useEffect(() => {
    hitsStatus(query.length > 0 && showHits)
  }, [showHits, query])

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indexName}
      onSearchStateChange={({ query }: any) => setQuery(query)}
    >
      <Overlay visible={query.length > 0 && showHits} hideSearch={hideSearch} />
      <CustomSearchBox onFocus={showSearch} />
      <HitsWrapper className={`${query.length > 0 && showHits ? 'show' : ''}`} onClick={hideSearch}>
        <Index key={indexName} indexName={indexName}>
          <Results>
            <Hits hitComponent={DocHit} />
          </Results>
        </Index>
      </HitsWrapper>
    </InstantSearch>
  )
}
