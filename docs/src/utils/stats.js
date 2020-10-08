const ReactGA = require('react-ga')
const config = require('../../config')

const GA_TRACKING_ID = 'UA-74131346-21'
const GA_ADDRESS = `${config.gatsby.siteUrl}/gastats.js`
const COLLECT_ADDRESS = 'https://stats.prisma.workers.dev'

module.exports = {
  init() {
    ReactGA.initialize(GA_TRACKING_ID, {
      gaAddress: GA_ADDRESS,
    })

    const ga = ReactGA.ga()
    ga('set', 'anonymizeIp', true)
    ga(u => {
      // Override sendHitTask to proxy tracking requests
      u.set('sendHitTask', model => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', COLLECT_ADDRESS, true)
        xhr.send(model.get('hitPayload'))
      })
    })
  },

  trackPage(page) {
    const { host } = window.location

    if (host.includes('netlify') || host.includes('localhost')) {
      return // exclude netlify previews from analytics
    }
    ReactGA.pageview(page)
  },
}
