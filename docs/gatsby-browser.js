const { init, trackPage } = require('./src/utils/stats')
const { goToNav } = require('./src/utils/goToNavItem')

exports.onClientEntry = () => {
  init()
}

exports.onRouteUpdate = ({ location }) => {
  trackPage(location.pathname)
  goToNav(location.pathname)
}
