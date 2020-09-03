export interface HeaderProps {
  logoLink: string
  links: { name: string; link: string }[] // create interface for this
}

export interface FooterProps {
  logoLink: string
  title: string
  products: { name: string; link: string }[]
  community: { name: string; link: string }[]
  resources: { name: string; link: string }[]
  company: { name: string; link: string }[]
  newsletter: { text: string }
  findus: any
}

interface SiteMeta {
  siteMetadata: {
    header: HeaderProps
    title: string
    footer: FooterProps
  }
}

export interface LayoutQueryData {
  site: SiteMeta
}
