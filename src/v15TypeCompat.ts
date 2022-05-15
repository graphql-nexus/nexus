import type { DirectiveLocation, DirectiveLocationEnum } from 'graphql'

export type ReadonlyArrayVersion16<Val> = typeof DirectiveLocation extends {
  QUERY: 'QUERY'
}
  ? Array<Val>
  : ReadonlyArray<Val>

export type DirectiveLocationCompat = typeof DirectiveLocation extends {
  QUERY: 'QUERY'
}
  ? DirectiveLocationEnum
  : // @ts-ignore
    DirectiveLocation
