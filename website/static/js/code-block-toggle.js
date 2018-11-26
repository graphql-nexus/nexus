// language-ts-graphql-tools
window.addEventListener("load", function() {
  var codeToggles = document.getElementsByClassName("code-toggle");
  const validLanguages = ["graphqliteral", "graphqljs", "graphqltools"];
  const languageLabels = {
    graphqliteral: "GraphQLiteral",
    graphqljs: "GraphQL JS",
    graphqltools: "graphql-tools (Apollo)",
  };
  Array.from(codeToggles).forEach((node) => {
    let preSibling = true;
    let currentNode = node;
    /**
     * @type {Array<{language: 'graphqliteral' | 'graphqljs' | 'graphqltools', node: Element}>}
     */
    const toggleNodes = [];
    while (preSibling) {
      const nextSibling = currentNode.nextElementSibling;
      if (nextSibling.nodeName === "PRE") {
        currentNode = nextSibling;
        if (currentNode.firstElementChild) {
          const nodeClasses = Array.from(
            currentNode.firstElementChild.classList
          );
          if (nodeClasses.indexOf("hljs") === -1) {
            break;
          }
          const langClass = nodeClasses.find(
            (c) => c.indexOf("language") === 0
          );
          if (!langClass) {
            console.error("Invalid code block");
            break;
          }
          const language = langClass.split("-")[1];
          if (validLanguages.indexOf(language) === -1) {
            console.error(
              `Invalid language ${language}, expected ${validLanguages.join(
                ", "
              )}`
            );
            break;
          }
          if (language !== "graphqliteral") {
            currentNode.style.display = "none";
          }
          const button = document.createElement("button");
          button.innerHTML = languageLabels[language];
          button.classList.add("toggleIcon");
          button.addEventListener("click", () => {
            toggleNodes.forEach((toggle) => {
              if (language !== toggle.language) {
                toggle.node.style.display = "none";
              } else {
                toggle.node.style.display = "";
              }
            });
          });
          toggleNodes.push({
            language,
            node: currentNode,
            button,
          });
          node.appendChild(button);
        }
      } else {
        preSibling = false;
      }
    }
  });
});
