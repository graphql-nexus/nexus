import * as React from 'react'
import styled from 'styled-components'
import Up from '../icons/Up'
import Down from '../icons/Down'
import Link from './link'
import config from '../../config'
import { ButtonWrapper } from './customMdx/button'
import Twitter from '../icons/Twitter'
import { useLocation } from '@reach/router'

const sentiments: any = {
  unhappy: 'Unhappy',
  happy: 'Happy',
}

const gitIssueUrl = `` // git issue link
const twitterShareUrl = `` // twitter share link

const PageBottomWrapper = styled.div`
  display: flex;
  font-size: 14px;
  flex-direction: row;
  justify-content: space-between;
  padding: 1rem 40px;
  align-items: center;
  button svg {
    cursor: pointer;
    transition: width 2s linear 1s;
  }
  .edit-git,
  .message {
    color: var(--code-inner-color) !important;
  }

  button {
    color: var(--white-color) !important;
  }
  @media (min-width: 0px) and (max-width: 767px) {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    .edit-git {
      order: 1;
    }
  }
`

const Feedback = styled.div`
  h4 {
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    color: var(--list-bullet-color) !important;
  }
  .sentiments {
    button {
      background: transparent;
      border: 0;
      &:hover svg {
        border-radius: 50%;
        background: rgba(204, 217, 223, 0.5);
      }
    }
  }
  @media (min-width: 0px) and (max-width: 767px) {
    order: 2;
  }
`

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-items: flex-start;
  cursor: default;
`

const Content = styled.div`
  flex: 1;
`

const Title = styled.div`
  margin: 0 0 16px 0 !important;
  font-weight: 600;
  font-size: 16px;
`
const P = styled.p`
  color: var(--list-bullet-color) !important;
  margin-top: 0;
`

const Button = styled(ButtonWrapper)`
  display: inline-flex !important;
  svg {
    margin-right: 10px;
    path {
      stroke: var(--white-color);
    }
  }
  @media (min-width: 0px) and (max-width: 767px) {
    font-size: 12px;
    text-transform: none;
    svg {
      width: 14px;
    }
  }
`

const PageBottom = ({ editDocsPath }: any) => {
  const [submitted, setSubmitted] = React.useState(false)
  const [sentiment, setSentiment] = React.useState(sentiments['happy'])

  let location = useLocation()
  const pageUrl = location ? location.pathname : '/'
  const currentDocsPageURL = encodeURIComponent(location ? location.href : '/')

  const sendFeedback = async (selectedSentiment: string) => {
    const body = JSON.stringify({ pageUrl, sentiment: sentiments[selectedSentiment] })
    const requestOptions: any = {
      method: 'POST',
      body,
    }
    await fetch(config.feedback.function_name, requestOptions)
  }

  const handleSentiment = (e: any) => {
    const selectedSentiment = e.currentTarget.id
    setSentiment(sentiments[selectedSentiment])
    setSubmitted(true)
    sendFeedback(selectedSentiment)
  }

  return (
    <PageBottomWrapper>
      {!submitted ? (
        <Feedback>
          <h4>Was this helpful?</h4>
          <div className="sentiments">
            <button id="happy" onClick={handleSentiment}>
              <Up />
            </button>
            <button id="unhappy" onClick={handleSentiment}>
              <Down />
            </button>
          </div>
        </Feedback>
      ) : (
        <Wrapper>
          <Content>
            <Title>Thank you for your feedback!</Title>
            {sentiment !== 'Happy' ? (
              <>
                <P>
                  We love to hear back from our community.
                  <br />
                  Tell us why on GitHub!
                </P>
                <Button target="_blank" href={gitIssueUrl} type="primary" color="dark">
                  Tell us On Github
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="dark"
                  type="primary"
                  href={`${twitterShareUrl}${currentDocsPageURL}`}
                >
                  <Twitter /> Share Nexus Docs on Twitter
                </Button>
              </>
            )}
          </Content>
        </Wrapper>
      )}
      {editDocsPath && (
        <Link className="edit-git" to={`${editDocsPath}`}>
          Edit this page on Github
        </Link>
      )}
    </PageBottomWrapper>
  )
}

export default PageBottom
