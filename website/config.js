const config = {
  gatsby: {
    pathPrefix: '',
    siteUrl: 'https://www.nexusjs.org',
    titlePrefix: '',
    titleSuffix: '',
  },
  redirects: [],
  header: {
    logoLink: 'https://www.nexusjs.org', // replace with nexus site
    title: 'Nexus',
    // check all links
    // links: [
    //   { name: 'Docs', link: 'https://www.nexusjs.org/docs' },
    //   { name: 'Quickstart', link: 'https://www.prisma.io/docs/getting-started/quickstart' },
    //   {
    //     name: 'Reference',
    //     link: 'https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/api',
    //   },
    //   { name: 'Blog', link: 'https://www.prisma.io/blog/' },
    //   { name: 'Community', link: 'https://www.prisma.io/community/' },
    //   { name: 'FAQ', link: 'https://www.prisma.io/docs/more/faq' },
    // ],
    links: [
      { name: 'Nexus Framework', link: '/' },
      { name: 'Nexus Schema', link: '/components-standalone/schema' },
    ],
    search: {
      indexName: process.env.GATSBY_ALGOLIA_INDEX_NAME,
      algoliaAppId: process.env.GATSBY_ALGOLIA_APP_ID,
      algoliaSearchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
      algoliaAdminKey: process.env.GATSBY_ALGOLIA_ADMIN_API_KEY,
    },
  },
  siteMetadata: {
    title: 'Nexus - title',
    description: 'Nexus - desc',
    keywords: 'Docs, nexus, 1.0',
    docsLocation: 'https://github.com/graphql-nexus/nexus/tree/master/website/content',
    twitter: {
      site: '@nexusgql',
      creator: '@nexusgql',
      image: '/social/missing.png',
    },
    og: {
      site_name: 'Nexus',
      type: 'website',
      image: {
        alt: 'Nexus',
        height: '630',
        type: 'image/png',
        url: '/social/missing.png', //replace social image
        width: '1200',
      },
    },
  },
  feedback: {
    function_name: 'https://nexusjs.org/.netlify/functions/index',
  },
  sidebar: {
    tablet_menu_split: [], // Slugs for top level folders which should appear in right pane on tablet
  },
  footer: {
    logoLink: '/',
    title: 'Nexus',
    products: [
      {
        name: 'Prisma Client',
        link: 'https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/crud',
      },
      { name: 'Prisma 1 Cloud', link: 'https://app.prisma.io/login' },
      // { name: 'Nexus', link: 'https://www.nexusjs.org/' },
      // { name: 'Prisma Admin', link: '/' },
      // { name: 'Prisma Enterprise', link: '/' },
    ],
    community: [
      { name: 'GitHub', link: 'https://github.com/graphql-nexus' },
      { name: 'GitHub Discussions', link: 'https://nxs.li/discussions' },
      { name: 'GraphQL Meetup', link: 'https://www.meetup.com/graphql-berlin/' },
    ],
    resources: [
      { name: 'Docs', link: '/' },

      { name: 'Tutorial', link: '/getting-started/tutorial/chapter-introduction' },

      { name: 'How to GraphQL', link: 'https://www.howtographql.com/' },
    ],
    /* start NOT USED */
    company: [
      { name: 'About', link: 'https://www.prisma.io/about' },
      { name: 'Jobs', link: 'https://www.prisma.io/jobs' },
      { name: 'Blog', link: 'https://www.prisma.io/blog/' },
      {
        name: 'Terms & Privacy',
        link: 'https://gist.github.com/nikolasburk/c0f34b0cc50d3403e2e0d40c0e6510aa',
      },
    ],
    /* end NOT USED */
    findus: {
      twitterLink: 'https://nxs.li/tweets',
      gitLink: 'https://github.com/graphql-nexus/',
      slackLink: '',
      fbLink: '',
      youtubeLink: '',
    },
    newsletter: {
      text: '',
    },
  },
}

module.exports = config
