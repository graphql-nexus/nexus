import Link from '../components/link'
import * as React from 'react'
import styled from 'styled-components'
import PrismaLogoGrey from '../icons/PrismaLogoGrey'
import NewsLetter from '../components/newsletter'
import Twitter from '../icons/Twitter'
import Youtube from '../icons/Youtube'
import Slack from '../icons/Slack'
import Github from '../icons/GitGrey'
import Facebook from '../icons/Facebook'

import { FooterProps } from '../interfaces/Layout.interface'

type FooterViewProps = {
  footerProps: FooterProps
}

const FooterWrapper = styled.div`
  background: transparent;
  width: 100%;
  display: flex;
  justify-content: center;
  color: var(--list-bullet-color);
  h3 {
    font-size: 1rem;
    line-height: 3rem;
    font-weight: bold;
    letter-spacing: 0.1em;
    margin: 0;
  }
  .container {
    padding: 15rem 10px;
    width: 1120px;
    display: flex;
    justify-content: space-between;

    > div {
      flex: 2;
    }
    @media (min-width: 0px) and (max-width: 767px) {
      flex-direction: column;
      padding: 3rem 0.5rem;
    }
  }
`

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;

  li {
    line-height: 2rem;
    a {
      text-decoration: none;
      color: var(--list-bullet-color) !important;
      &:hover {
        color: var(--code-inner-color) !important;
        .tag {
          transform: scale(1.05);
        }
      }
      .tag {
        display: inline-block;
        border-radius: 6px;
        margin-left: 8px;
        padding: 0 8px;
        background: var(--code-added-color);
        font-size: 12px;
        font-weight: bold;
        color: white;
        transition: transform 0.1s ease-in;
      }
    }
  }
`

const Title = styled.span`
  font-size: 1.2rem;
  font-style: normal;
  font-weight: bold;
  line-height: 100%;
  letter-spacing: -0.02em;
`

const LogoContainer = styled.div`
  padding-right: 0.75rem;
`

const SocialWrapper = styled.div`
  flex: 3 !important;
  p {
    margin: 0;
  }
  .social {
    margin-top: 2rem;

    &-links {
      display: flex;
      align-items: center;
      margin-top: 10px;
      a {
        margin-right: 24px;
        svg {
          transition: transform 0.1s ease-in;
        }

        &: hover {
          color: var(--code-inner-color) !important;
          svg {
            transform: scale(1.2);
          }
        }
      }
    }
    &-text {
      margin-top: 2rem;
    }
  }
`

const Footer = ({ footerProps }: FooterViewProps) => {
  const {
    logoLink,
    title,
    products,
    resources,
    community,
    /*    company,
    newsletter, */
    findus,
  } = footerProps
  return (
    <FooterWrapper>
      <div className="container">
        <div style={{ display: 'flex', marginTop: '20px' }}>
          <Link
            to={logoLink || '/'}
            style={{
              color: 'white',
              textDecoration: 'none',
            }}
          >
            <LogoContainer>
              <PrismaLogoGrey />
            </LogoContainer>
          </Link>
          <Title>{title}</Title>
        </div>
        <div>
          {/*           <LinkList>
            <h3>PRODUCTS</h3>
            {products.map((item: any, index: number) => (
              <li key={index}>
                <Link to={item.link}>{item.name}</Link>
              </li>
            ))}
          </LinkList> */}

          <LinkList>
            <h3>RESOURCES</h3>
            {resources.map((item: any, index: number) => (
              <li key={index}>
                <Link to={item.link}>{item.name}</Link>
              </li>
            ))}
          </LinkList>
        </div>
        <div>
          <LinkList>
            <h3>COMMUNITY</h3>
            {community.map((item: any, index: number) => (
              <li key={index}>
                <Link to={item.link}>{item.name}</Link>
              </li>
            ))}
          </LinkList>

          {/*           <LinkList>
            <h3>COMPANY</h3>
            {company.map((item: any, index: number) => (
              <li key={index}>
                <Link to={item.link}>
                  {item.name}
                  {item.name === 'Jobs' && <span className="tag">We're Hiring</span>}
                </Link>
              </li>
            ))}
          </LinkList> */}
        </div>

        <SocialWrapper>
          {/* <NewsLetter newsletter={newsletter} /> */}

          <div>
            <h3>FIND US</h3>
            <div className="social-links">
              <Link to={findus.twitterLink}>
                <Twitter />
              </Link>
              {
                /*               <Link to={findus.fbLink}>
                <Facebook />
              </Link>
              <Link to={findus.youtubeLink}>
                <Youtube />
              </Link> 
              <Link to={findus.slackLink}>
                <Slack />
              </Link>*/
                <Link to={findus.gitLink}>
                  <Github />
                </Link>
              }
            </div>

            <p className="social-text">Prisma © 2018-2020</p>
            <p>Made with ❤️ in Berlin</p>
          </div>
        </SocialWrapper>
      </div>
    </FooterWrapper>
  )
}

export default Footer
