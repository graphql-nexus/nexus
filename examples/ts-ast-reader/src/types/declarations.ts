import { objectType } from "gqliteral";
import {
  nodeType,
  hasJsDoc,
  functionLikeDeclaration,
  namedType,
} from "./mixins";
import typescript from "typescript";
import { knownNodesList } from "./utils";

export const ExportAssignment = objectType("ExportAssignment", (t) => {
  nodeType(t);
});

export const SourceFile = objectType("SourceFile", (t) => {
  nodeType(t);
  t.field("statements", "Node", {
    list: true,
    resolve: knownNodesList("statements"),
  });
});

export const NamedDeclaration = objectType("NamedDeclaration", (t) => {
  nodeType(t);
});

export const TypeParameterDeclaration = objectType(
  "TypeParameterDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const CallSignatureDeclaration = objectType(
  "CallSignatureDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const ConstructSignatureDeclaration = objectType(
  "ConstructSignatureDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const VariableDeclaration = objectType("VariableDeclaration", (t) => {
  nodeType(t);
});

export const ParameterDeclaration = objectType("ParameterDeclaration", (t) => {
  nodeType(t);
  hasJsDoc(t);
  namedType(t);
  t.field("type", "Node", { nullable: true });
});

export const PropertyDeclaration = objectType("PropertyDeclaration", (t) => {
  nodeType(t);
});

export const PropertyLikeDeclaration = objectType(
  "PropertyLikeDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const FunctionDeclaration = objectType("FunctionDeclaration", (t) => {
  nodeType(t);
  functionLikeDeclaration(t);
});

export const MethodDeclaration = objectType("MethodDeclaration", (t) => {
  nodeType(t);
  functionLikeDeclaration(t);
});

export const ConstructorDeclaration = objectType(
  "ConstructorDeclaration",
  (t) => {
    nodeType(t);
    functionLikeDeclaration(t);
  }
);

export const GetAccessorDeclaration = objectType(
  "GetAccessorDeclaration",
  (t) => {
    nodeType(t);
    functionLikeDeclaration(t);
  }
);

export const SetAccessorDeclaration = objectType(
  "SetAccessorDeclaration",
  (t) => {
    nodeType(t);
    functionLikeDeclaration(t);
  }
);

export const IndexSignatureDeclaration = objectType(
  "IndexSignatureDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const MissingDeclaration = objectType("MissingDeclaration", (t) => {
  nodeType(t);
});

export const ClassDeclaration = objectType("ClassDeclaration", (t) => {
  nodeType(t);
  namedType(t);
  t.field("members", "Node", {
    list: true,
    resolve: knownNodesList("members"),
  });
});

export const InterfaceDeclaration = objectType("InterfaceDeclaration", (t) => {
  nodeType(t);
});

export const TypeAliasDeclaration = objectType("TypeAliasDeclaration", (t) => {
  nodeType(t);
});

export const EnumDeclaration = objectType("EnumDeclaration", (t) => {
  nodeType(t);
});

export const ModuleDeclaration = objectType("ModuleDeclaration", (t) => {
  nodeType(t);
});

export const NamespaceDeclaration = objectType("NamespaceDeclaration", (t) => {
  nodeType(t);
});

export const JSDocNamespaceDeclaration = objectType(
  "JSDocNamespaceDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const ImportEqualsDeclaration = objectType(
  "ImportEqualsDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const ImportDeclaration = objectType("ImportDeclaration", (t) => {
  nodeType(t);
});

export const NamespaceExportDeclaration = objectType(
  "NamespaceExportDeclaration",
  (t) => {
    nodeType(t);
  }
);

export const ExportDeclaration = objectType("ExportDeclaration", (t) => {
  nodeType(t);
});
