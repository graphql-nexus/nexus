import { asNexusMethod } from "nexus";
import { GraphQLDate } from "graphql-iso-date";

export const GQLDate = asNexusMethod(GraphQLDate, "date");

export * from "./User";
export * from "./Query";
export * from "./Post";
