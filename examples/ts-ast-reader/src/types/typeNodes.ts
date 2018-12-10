import { objectType } from "nexus";
import { nodeType } from "./mixins";

export const KeywordTypeNode = objectType("KeywordTypeNode", (t) => {
  nodeType(t);
});

export const ImportTypeNode = objectType("ImportTypeNode", (t) => {
  nodeType(t);
});

export const ThisTypeNode = objectType("ThisTypeNode", (t) => {
  nodeType(t);
});

export const FunctionTypeNode = objectType("FunctionTypeNode", (t) => {
  nodeType(t);
  t.field("type", "Node");
});

export const ConstructorTypeNode = objectType("ConstructorTypeNode", (t) => {
  nodeType(t);
  t.field("type", "Node");
});

export const ArrayTypeNode = objectType("ArrayTypeNode", (t) => {
  nodeType(t);
  t.field("elementType", "Node");
});

export const TupleTypeNode = objectType("TupleTypeNode", (t) => {
  nodeType(t);
  t.field("elementTypes", "Node", { list: true });
});

export const OptionalTypeNode = objectType("OptionalTypeNode", (t) => {
  nodeType(t);
  t.field("type", "Node");
});

export const RestTypeNode = objectType("RestTypeNode", (t) => {
  nodeType(t);
  t.field("type", "Node");
});

export const UnionType = objectType("UnionType", (t) => {
  nodeType(t);
  t.field("types", "Node", { list: true });
});

export const IntersectionTypeNode = objectType("IntersectionTypeNode", (t) => {
  nodeType(t);
  t.field("types", "Node", { list: true });
});

export const ConditionalTypeNode = objectType("ConditionalTypeNode", (t) => {
  nodeType(t);
  t.field("checkType", "Node");
  t.field("extendsType", "Node");
  t.field("trueType", "Node");
  t.field("falseType", "Node");
});

export const InferTypeNode = objectType("InferTypeNode", (t) => {
  nodeType(t);
  t.field("typeParameter", "Node");
});

export const ParenthesizedType = objectType("ParenthesizedType", (t) => {
  nodeType(t);
  t.field("type", "Node");
});

export const IndexedAccessTypeNode = objectType(
  "IndexedAccessTypeNode",
  (t) => {
    nodeType(t);
  }
);

export const MappedTypeNode = objectType("MappedTypeNode", (t) => {
  nodeType(t);
});

export const LiteralType = objectType("LiteralType", (t) => {
  nodeType(t);
});

export const TypeLiteral = objectType("TypeLiteral", (t) => {
  nodeType(t);
});
