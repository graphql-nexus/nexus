import { makeSchema } from "@nexus/schema"
import * as User from "./User"

export const schema = makeSchema({
  types: [User],
})

export default schema
