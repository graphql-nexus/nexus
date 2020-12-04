import { makeSchema } from "nexus"
import * as User from "./User"

export const schema = makeSchema({
  types: [User],
})

export default schema
