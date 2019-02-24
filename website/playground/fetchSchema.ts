import { introspectionQuery, buildClientSchema } from "graphql";
import { printSchema } from "graphql";

export function fetchSchema(url: string) {
  const result: any = fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operationName: "IntrospectionQuery",
      query: introspectionQuery,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(({ data }) => {
      const schema = buildClientSchema(data);
      const printedSchema = printSchema(schema);
      return printedSchema;
    })
    .catch((e: any) => console.log(e));
  return result;
}
