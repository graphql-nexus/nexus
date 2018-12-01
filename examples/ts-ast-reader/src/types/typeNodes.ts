import { objectType } from "gqliteral";
import { nodeType } from "./mixins";

export const KeywordTypeNode = objectType("KeywordTypeNode", nodeType);

export const ImportTypeNode = objectType("ImportTypeNode", nodeType);

export const ThisTypeNode = objectType("ThisTypeNode", nodeType);

export const FunctionTypeNode = objectType("FunctionTypeNode", nodeType);

export const ConstructorTypeNode = objectType("ConstructorTypeNode", nodeType);

export const ArrayTypeNode = objectType("ArrayTypeNode", nodeType);

export const TupleTypeNode = objectType("TupleTypeNode", nodeType);

export const OptionalTypeNode = objectType("OptionalTypeNode", nodeType);

export const RestTypeNode = objectType("RestTypeNode", nodeType);

export const UnionTypeNode = objectType("UnionTypeNode", nodeType);

export const IntersectionTypeNode = objectType(
  "IntersectionTypeNode",
  nodeType
);

export const ConditionalTypeNode = objectType("ConditionalTypeNode", nodeType);

export const InferTypeNode = objectType("InferTypeNode", nodeType);

export const ParenthesizedTypeNode = objectType(
  "ParenthesizedTypeNode",
  nodeType
);

export const IndexedAccessTypeNode = objectType(
  "IndexedAccessTypeNode",
  nodeType
);

export const MappedTypeNode = objectType("MappedTypeNode", nodeType);

export const LiteralTypeNode = objectType("LiteralTypeNode", nodeType);
