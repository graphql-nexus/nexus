import { GQLiteralObject } from "../../../../../src";

export const Person = GQLiteralObject("Person", t => {
  t.string("name", { description: "The name of this person" });
  t.string("birthYear", {
    property: "birth_year",
    description: `The birth year of the person, using the in-universe standard of BBY or ABY -
Before the Battle of Yavin or After the Battle of Yavin. The Battle of Yavin is
a battle that occurs at the end of Star Wars episode IV: A New Hope.`,
  });
  t.string("eyeColor", {
    property: "eye_color",
    description: `The eye color of this person. Will be "unknown" if not known or "n/a" if the
person does not have an eye.`,
  });
  t.string("gender", {
    description: `The gender of this person. Either "Male", "Female" or "unknown",
"n/a" if the person does not have a gender.`,
    defaultValue: "n/a",
  });
  t.string("hairColor", {
    property: "hair_color",
    description: `The hair color of this person. Will be "unknown" if not known or "n/a" if the
    person does not have hair.`,
  });
  t.int("height", {
    resolve: person => convertToNumber(person.height),
    description: "The height of the person in centimeters.",
  });
  t.float("mass", {
    resolve: person => convertToNumber(person.mass),
    description: "The mass of the person in kilograms.",
  });
  t.string("skinColor", {
    property: "skin_color",
    description: "The skin color of this person.",
  });
  t.field("homeworld", "Planet", {
    resolve: person =>
      person.homeworld ? getObjectFromUrl(person.homeworld) : null,
    description: "A planet that this person was born on or inhabits.",
  });
});

/**
 * Given a string, convert it to a number
 */
function convertToNumber(value: string): number | null {
  if (["unknown", "n/a"].indexOf(value) !== -1) {
    return null;
  }
  // remove digit grouping
  const numberString = value.replace(/,/, "");
  return Number(numberString);
}

function getObjectFromUrl(item: string) {
  return {};
}
