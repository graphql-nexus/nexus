import * as React from 'react'
import styled from 'styled-components'
import Email from '../../icons/Email'
import ArrowEmail from '../../icons/ArrowEmail'
import * as valid from './valid'
import sendToMailchimp from './mailChimp'

const NewsLetterWrapper = styled.div`
  h4 {
    margin: 0;
    line-height: 3rem;
    font-weight: bold;
    letter-spacing: 0.1em;
  }
  .email {
    position: relative;
    margin-top: 24px;
    display: flex;
    align-items: center;
    input {
      background: var(--white-color);
      box-shadow: 0px 4px 8px rgba(60, 45, 111, 0.1), 0px 1px 3px rgba(60, 45, 111, 0.15);
      border-radius: 5px;
      width: 100%;
      border: 0;
      padding: 24px 60px;
      font-size: 100%;
      font-family: Open Sans;
      font-weight: normal;

      &::placeholder {
        color: var(--code-highlight-color);
      }
    }
    .email-icon {
      position: absolute;
      left: 24px;
    }
    button {
      outline: 0;
      position: absolute;
      right: 24px;
      border: 0;
      background: transparent;
      padding: 0;
      width: 32px;
      height: 32px;
      circle {
        transition: 0.2s fill ease;
        fill: var(--code-added-color);
      }
      path {
        transition: 0.2s stroke ease;
        stroke: var(--white-color);
      }
      &[disabled] {
        cursor: default;

        circle {
          fill: var(--border-color);
        }
        path {
          stroke: var(--code-inner-color);
        }
      }
    }
  }
`

const Newsletter = ({ newsletter }: any) => {
  const [submitted, setSubmitted] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [validEmail, setValidEmail] = React.useState(false)

  const validate = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target
    if (!(target instanceof HTMLInputElement)) {
      return
    }
    const email = valid.email(target.value)
    if (email instanceof Error) {
      setEmail(target.value.toLowerCase())
      setValidEmail(false)
      return
    }
    setEmail(email)
    setValidEmail(true)
  }

  const submitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await sendToMailchimp(email)
    setEmail('')
    setValidEmail(false)
    setSubmitted(true)
  }

  return (
    <NewsLetterWrapper>
      <h4>NEWSLETTER</h4>
      <p>{newsletter.text}</p>

      <form className="email" onSubmit={submitEmail}>
        <Email className="email-icon" />
        <input
          type="text"
          placeholder={submitted ? 'Thank you!' : 'your@email.com'}
          value={email}
          onChange={validate}
          disabled={submitted}
        />
        <button disabled={submitted || !validEmail} type="submit">
          <ArrowEmail />
        </button>
      </form>
    </NewsLetterWrapper>
  )
}

export default Newsletter
