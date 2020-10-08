import * as React from 'react'
import Layout from '../components/layout'
import styled from 'styled-components'

const NotFoundWrapper = styled.div`
  font-family: 'Open Sans';
  margin-top: 200px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  h1 {
    font-weight: bold;
  }
`

const NotFoundPage = () => (
  <Layout>
    <NotFoundWrapper>
      <h1>404 | NOT FOUND</h1>
      You just hit a route that doesn&#39;t exist!
    </NotFoundWrapper>
  </Layout>
)

export default NotFoundPage
