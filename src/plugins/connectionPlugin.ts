// import { plugin } from "../plugin";
// import { objectType } from "../definitions/objectType";
// import { dynamicOutputMethod } from "../dynamicMethod";
// import { intArg } from '../definitions/args';

// export function base64(i: string) {
//   return Buffer.from(i, "utf8").toString("base64");
// }

// export function unbase64(i: string) {
//   return Buffer.from(i, "base64").toString("utf8");
// }

// export interface ConnectionPluginConfig {
//   /**
//    * @default 'connectionField'
//    */
//   fieldName?: string;
//   /**
//    * Field description
//    */
//   description?: string;
//   /**
//    * Deprecation reason
//    */
//   deprecated?: string;
//   /**
//    * Whether we want the inputs to follow the spec, or if we
//    * want something different across the board
//    * for instance - { input: { pageSize: intArg(), page: intArg() } }
//    */
//   inputs?: "spec" | Args;
//   /**
//    * How we want the connection name to be named.
//    * Provide this option to override.
//    *
//    * @default
//    *
//    * type Organization {
//    *   members(...): UserConnection
//    * }
//    *
//    * unless either the `inputs`, `extendEdge`, or `extendConnection`
//    * are provided on the field definition - in which case:
//    *
//    * type Organization {
//    *   members(...): OrganizationMembersUserConnection
//    * }
//    */
//   name?: (fieldConfig) => string;
//   /**
//    * The edge type we want to return
//    */
//   edgeType?: (fieldConfig) => string;
//   /**
//    * Whether we want the "edges" field on the connection / need to
//    * implement this in the contract.
//    *
//    * @default true
//    */
//   edges?: boolean;
//   /**
//    * Whether we want "pageInfo" field on the connection / need to
//    * implement this in the contract.
//    *
//    * @default true
//    */
//   pageInfo?: boolean;
//   /**
//    * Extend *all* edges to include additional fields, beyond cursor.
//    */
//   extendEdge?: Record<string, { type: resolve }>;
//   /**
//    * Any additional fields we want to make available to the connection type,
//    * beyond what is in the spec / configured above.
//    */
//   extendConnection?: Record<string, { type: resolve }>;
// }

// const defaultConfig = {
//   inputs: {
//     first: intArg(),
//   }
// };

// export const connectionPlugin = (config: "spec" | ConnectionPluginConfig) => {
//   const finalConfig = config === "spec" ? defaultConfig : config;

//   return plugin({
//     name: "ConnectionPlugin",
//     onInstall(t) {
//       return {
//         types: [
//           dynamicOutputMethod({
//             name: .fieldName || "connectionField",
//             factory(o) {},
//           }),
//         ],
//       };
//     },
//     onMissingType(missingTypeName, builder) {
//       const match = /(.*?)Connection$/.exec(missingTypeName);
//       if (match) {
//         return objectType({
//           name: missingTypeName,
//           definition(t) {},
//         });
//       }
//       return;
//     },
//   });
// };
