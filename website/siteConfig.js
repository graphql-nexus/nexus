// List of projects/orgs using your project for the users page.
// const users = [
//   {
//     caption: "User1",
//     // You will need to prepend the image path with your baseUrl
//     // if it is not '/', like: '/test-site/img/docusaurus.svg'.
//     image: "/img/docusaurus.svg",
//     infoLink: "https://www.facebook.com",
//     pinned: true,
//   },
// ];

const siteConfig = {
  title: "GQLiteral", // Title for your website.
  tagline:
    "Simple, strongly typed GraphQL schema construction for TypeScript/JavaScript",
  url: "https://tgriesser.com", // Your website URL
  baseUrl: "/gqliteral/", // Base URL for your project */

  // Used for publishing and more
  projectName: "gqliteral",
  organizationName: "tgriesser",

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { doc: "getting-started", label: "Docs" },
    { page: "playground", label: "Playground" },
    { page: "comparison", label: "Compare" },
    { page: "help", label: "Help" },
    { blog: true, label: "Blog" },
  ],

  // If you have users set above, you add it here:
  // users,

  /* path to images for header/footer */
  // headerIcon: "img/docusaurus.svg",
  // footerIcon: "img/docusaurus.svg",
  favicon: "img/favicon.png",

  /* Colors for website */
  colors: {
    primaryColor: "#2E8555",
    secondaryColor: "#205C3B",
  },

  /* Custom fonts for website */
  /*
  fonts: {
    myFont: [
      "Times New Roman",
      "Serif"
    ],
    myOtherFont: [
      "-apple-system",
      "system-ui"
    ]
  },
  */

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} Tim Griesser`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: "default",
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: [
    "https://buttons.github.io/buttons.js",
    "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js",
    "/gqliteral/js/code-block-buttons.js",
    "/gqliteral/js/code-block-toggle.js",
  ],
  stylesheets: ["/gqliteral/css/code-block-buttons.css"],

  // On page navigation for the current documentation page.
  onPageNav: "separate",
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  ogImage: "img/docusaurus.png",
  twitterImage: "img/docusaurus.png",

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  // enableUpdateTime: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  //   repoUrl: 'https://github.com/facebook/test-site',
  separateCss: ["static/separate-css"],
};

module.exports = siteConfig;
