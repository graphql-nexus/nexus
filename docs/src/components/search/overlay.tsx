import * as React from 'react'
import styled from 'styled-components'
import styledTS from 'styled-components-ts'

interface Props {
  visible: boolean
  hideSearch: () => void
}

const Overlay = ({ visible, hideSearch }: Props) => {
  const [transition, setTransition] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      setTransition(true)
    }, 1000)
  })

  return <StyledOverlay isVisible={visible} isTransitioning={transition} onClick={hideSearch} />
}

const StyledOverlay = styledTS<{ isVisible: boolean; isTransitioning: boolean }>(styled.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(8, 35, 51, 0.3);
  opacity: 0;
  pointer-events: none;
  z-index: 10000;

  ${p => p.isTransitioning && 'transition: opacity 0.25s ease-in-out;'}
  ${p => (p.isVisible ? 'opacity: 1; pointer-events: all;' : 'opacity: 0; pointer-events: none;')}
`

export default Overlay
