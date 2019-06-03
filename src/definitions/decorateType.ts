import { GraphQLNamedType } from "graphql";
import { RootTypingDef } from "./_types";

export interface TypeExtensionConfig {
  asNexusMethod: string;
  rootTyping?: RootTypingDef;
}

export type NexusTypeExtensions = {
  nexus: TypeExtensionConfig;
};

export function decorateType<T extends GraphQLNamedType>(
  type: T & { extensions?: NexusTypeExtensions },
  config: TypeExtensionConfig
): T & { extensions: NexusTypeExtensions } {
  type.extensions = {
    ...type.extensions,
    nexus: {
      asNexusMethod: config.asNexusMethod,
      rootTyping: config.rootTyping,
    },
  };
  return type as any;
}
