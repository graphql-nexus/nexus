export type BaseScalarNames = "String" | "Int" | "Float" | "ID" | "Boolean";

export type GQLiteralGeneratedScalars = {};
export type GQLiteralGeneratedInterfaces = {
  Character: {
    members: "Droid" | "Human";
    fields: {
      appearsIn: {
        type: any;
        args: {};
      };
      friends: {
        type: any;
        args: {};
      };
      id: {
        type: any;
        args: {};
      };
      name: {
        type: any;
        args: {};
      };
    };
  };
};
export type GQLiteralGeneratedUnions = {};
export type GQLiteralGeneratedEnums = {
  Episode: any;
  MoreEpisodes: any;
};
export type GQLiteralGeneratedInputObjects = {};
export type GQLiteralGeneratedObjects = {
  Query: {
    backingType: any;
    fields: {
      droid: {
        type: any;
        args: {
          id: any;
        };
      };
      hero: {
        type: any;
        args: {
          episode: any;
        };
      };
      human: {
        type: any;
        args: {
          id: any;
        };
      };
    };
  };
  Droid: {
    backingType: any;
    fields: {
      appearsIn: {
        type: any;
        args: {};
      };
      friends: {
        type: any;
        args: {};
      };
      id: {
        type: any;
        args: {};
      };
      name: {
        type: any;
        args: {};
      };
      primaryFunction: {
        type: any;
        args: {};
      };
    };
  };
  Human: {
    backingType: any;
    fields: {
      appearsIn: {
        type: any;
        args: {};
      };
      friends: {
        type: any;
        args: {};
      };
      homePlanet: {
        type: any;
        args: {};
      };
      id: {
        type: any;
        args: {};
      };
      name: {
        type: any;
        args: {};
      };
    };
  };
};
export type GQLiteralGeneratedSchema = {
  enums: GQLiteralGeneratedEnums;
  objects: GQLiteralGeneratedObjects;
  inputObjects: GQLiteralGeneratedInputObjects;
  unions: GQLiteralGeneratedUnions;
  scalars: GQLiteralGeneratedScalars;
  interfaces: GQLiteralGeneratedInterfaces;

  // For simplicity in autocomplete:
  availableInputTypes:
    | BaseScalarNames
    | Extract<keyof GQLiteralGeneratedInputObjects, string>
    | Extract<keyof GQLiteralGeneratedEnums, string>
    | Extract<keyof GQLiteralGeneratedScalars, string>;
  availableOutputTypes:
    | BaseScalarNames
    | Extract<keyof GQLiteralGeneratedObjects, string>
    | Extract<keyof GQLiteralGeneratedEnums, string>
    | Extract<keyof GQLiteralGeneratedUnions, string>
    | Extract<keyof GQLiteralGeneratedInterfaces, string>
    | Extract<keyof GQLiteralGeneratedScalars, string>;
};
export type Gen = GQLiteralGeneratedSchema;
