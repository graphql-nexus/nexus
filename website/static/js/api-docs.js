document.addEventListener("DOMContentLoaded", function() {
  const isApiReference = window.location.href.indexOf("/api-reference") !== -1;
  if (isApiReference) {
    const body = document.getElementsByTagName("body")[0];
    body.classList.add("sideNavVisible", "separateOnPageNav");
  }
  let elementsToFind = Array.from(document.querySelectorAll("a.button"));
  const docsNav = document.getElementById("docsNav");
  if (docsNav) {
    elementsToFind = Array.from(docsNav.getElementsByTagName("a")).concat(
      elementsToFind
    );
  }
  elementsToFind.forEach(function(item) {
    const href = item.getAttribute("href");
    if (href && href.indexOf("api-reference") !== -1) {
      item.setAttribute("href", href.replace("/docs", ""));
      if (isApiReference) {
        item.parentElement.classList.add("navListItem", "navListItemActive");
      }
    }
  });
});
