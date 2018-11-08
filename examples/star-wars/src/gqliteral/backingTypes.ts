/**
 * These are Flow types which correspond to the schema.
 * They represent the shape of the data visited during field resolution.
 */
export interface Character {
  id: string;
  name: string;
  friends: string[];
  appears_in: number[];
}

export interface Human extends Character {
  type: "Human";
  home_planet?: string;
}

export interface Droid extends Character {
  type: "Droid";
  primary_function: string;
}
