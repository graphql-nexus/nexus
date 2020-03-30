import { decorateType } from "@nexus/schema";
import { GraphQLDate } from "graphql-iso-date";

export const GQLDate = decorateType(GraphQLDate, {
  rootTyping: "Date",
  asNexusMethod: "date",
});

export * from "./User";
export * from "./Query";
export * from "./Post";
