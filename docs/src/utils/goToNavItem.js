module.exports = {
  goToNav(pathname) {
    var currentElem = document.getElementById(pathname)
    const sidebarElem = document.getElementById('sidebar-container')
    if (currentElem && sidebarElem) {
      var topPos = currentElem.getBoundingClientRect().top - 250
      sidebarElem.scrollTo(0, topPos)
    }
  },
}
