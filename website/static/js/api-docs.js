document.addEventListener("DOMContentLoaded", function() {
  Array.from(document.getElementsByTagName("a")).forEach(function(item) {
    const href = item.getAttribute("href");
    if (href && href.indexOf("api-reference") !== -1) {
      item.setAttribute("href", href.replace("/docs", ""));
    }
  });
  if (window.location.href.indexOf("/api") === -1) {
    return;
  }
  const body = document.getElementsByTagName("body")[0];
  body.classList.add("sideNavVisible", "separateOnPageNav");
});
