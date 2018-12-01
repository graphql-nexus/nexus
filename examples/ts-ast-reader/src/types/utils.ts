import { GraphQLResolveInfo, GraphQLSchema, isObjectType } from "graphql";
import ts from "typescript";

export function convertTsEnum(toConvert: any) {
  const converted: { [key: string]: number } = {};
  Object.keys(toConvert).forEach((key) => {
    if (/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(key)) {
      converted[key] = toConvert[key];
    }
  });
  return converted;
}

const knownNodesMap = new WeakMap<GraphQLSchema, Set<string>>();

export function allKnownNodes(schema: GraphQLSchema) {
  let knownNodes = knownNodesMap.get(schema);
  if (!knownNodes) {
    const fields = schema.getTypeMap();
    knownNodes = new Set();
    Object.keys(fields).forEach((key) => {
      const field = fields[key];
      if (
        isObjectType(field) &&
        Boolean(field.getInterfaces().find((i) => i.name === "Node"))
      ) {
        knownNodes!.add(field.name);
      }
    });
    knownNodesMap.set(schema, knownNodes);
  }
  return knownNodes!;
}

export function knownNodesList(propertyName: string) {
  return (root: any, args: any, ctx: any, info: GraphQLResolveInfo) => {
    return root[propertyName]
      ? root[propertyName].filter((node: any) => {
          return (
            node &&
            node.kind &&
            allKnownNodes(info.schema).has(ts.SyntaxKind[node.kind])
          );
        })
      : null;
  };
}
