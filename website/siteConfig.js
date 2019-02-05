const siteConfig = {
  title: "GraphQL Nexus", // Title for your website.
  tagline: "Declarative, Code-First GraphQL Schemas for JavaScript/TypeScript",
  url: "https://nexus.js.org", // Your website URL
  baseUrl: "/", // Base URL for your project */
  gaTrackingId: "UA-39763513-4",

  algolia: {
    apiKey: "80f72460aa3d84abf56948140313b079",
    indexName: "graphql-nexus",
    algoliaOptions: {}, // Optional, if provided by Algolia
  },

  // Used for publishing and more
  projectName: "nexus",
  organizationName: "graphql-nexus",

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { doc: "getting-started", label: "Getting Started" },
    { page: "playground", label: "Playground" },
    { page: "converter", label: "SDL Converter" },
    {
      href: "https://github.com/graphql-nexus/nexus/tree/develop/examples",
      label: "Examples",
    },
    {
      href: "https://github.com/graphql-nexus/nexus",
      label: "GitHub",
    },
    { search: true },
  ],

  // If you have users set above, you add it here:
  // users,

  /* path to images for header/footer */
  headerIcon: "img/nexus.png",
  footerIcon: "img/nexus.png",
  favicon: "img/favicon.png",

  /* Colors for website */
  colors: {
    primaryColor: "#2A6379",
    secondaryColor: "#A3A3A3",
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
    theme: "atom-one-dark",
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: [
    "https://use.fontawesome.com/releases/v5.7.1/js/all.js",
    "https://buttons.github.io/buttons.js",
    "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js",
    "/js/code-block-buttons.js",
  ],
  stylesheets: ["/css/code-block-buttons.css"],

  // On page navigation for the current documentation page.
  onPageNav: "separate",
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  ogImage: "img/nexus.png",
  twitterImage: "img/nexus.png",

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  // enableUpdateTime: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  repoUrl: "https://github.com/graphql-nexus/nexus",
  separateCss: ["static/separate-css"],

  // users,
};

module.exports = siteConfig;
