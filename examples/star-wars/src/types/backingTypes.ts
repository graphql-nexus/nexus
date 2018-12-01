/**
 * These are Flow types which correspond to the schema.
 * They represent the shape of the data visited during field resolution.
 */
export interface CharacterFields {
  id: string;
  name: string;
  friends: string[];
  appears_in: number[];
}

export interface Human extends CharacterFields {
  type: "Human";
  home_planet?: string;
}

export interface Droid extends CharacterFields {
  type: "Droid";
  primary_function: string;
}

export type Character = Human | Droid;

export interface ContextType {}
