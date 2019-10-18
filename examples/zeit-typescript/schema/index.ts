import * as User from "./User"
import { makeSchema } from "nexus"

export const schema = makeSchema({
  types: [User],
})

export default schema
