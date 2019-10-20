import { NowRequest, NowResponse } from "@now/node"
import { printSchema } from "graphql"
import schema from "../schema"

export default function(_req: NowRequest, res: NowResponse) {
  res.status(200).send(`<pre>${printSchema(schema)}</pre>`)
}
