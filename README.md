<p align="center"><a href="https://nexus.js.org"><img src="https://i.imgur.com/Y5BgDGl.png" width="150" /><a></p>

# [GraphQL Nexus](https://nexus.js.org)

Declarative, code-first, strongly typed GraphQL schema construction for JavaScript/TypeScript.

_Note: This library is independent of the Prisma database client. For the prisma-plugin, visit https://github.com/prisma/nexus-prisma_

## [Read the Documentation](https://nexus.js.org)

## [Check out the Examples](https://github.com/prisma/nexus/tree/develop/examples)

```
yarn add nexus // or npm install nexus
```

---

### Example Star Wars Schema:

```ts
export const Character = interfaceType({
  name: "Character",
  definition: (t) => {
    t.string("id", { description: "The id of the character" });
    t.string("name", { description: "The name of the character" });
    t.list.field("friends", {
      type: Character,
      description:
        "The friends of the character, or an empty list if they have none.",
      resolve: (character) => getFriends(character),
    });
    t.list.field("appearsIn", {
      type: "Episode",
      description: "Which movies they appear in.",
      resolve: (o) => o.appears_in,
      args: {
        id: idArg({ required: true }),
      },
    });
    t.resolveType((character) => character.type);
  },
});

export const Droid = objectType({
  name: "Droid",
  description: "A mechanical creature in the Star Wars universe.",
  definition(t) {
    t.implements(Character);
    t.string("primaryFunction", {
      description: "The primary function of the droid.",
      resolve: (o) => o.primary_function || "N/A",
    });
  },
});

const OriginalEpisodes = [
  { name: "NEWHOPE", value: 4, description: "Released in 1977." },
  { name: "EMPIRE", value: 5, description: "Released in 1980." },
  { name: "JEDI", value: 6, description: "Released in 1983" },
];

export const Episode = enumType({
  name: "Episode",
  description: "One of the films in the Star Wars Trilogy",
  members: OriginalEpisodes,
});

export const Human = objectType({
  name: "Human",
  description: "A humanoid creature in the Star Wars universe.",
  definition(t) {
    t.implements(Character);
    t.string("homePlanet", {
      nullable: true,
      description: "The home planet of the human, or null if unknown.",
      resolve: (o) => o.home_planet || null,
    });
  },
});

const characterArgs = {
  id: stringArg({
    required: true,
    description: "id of the character",
  }),
};

const heroArgs = {
  episode: arg({
    type: "Episode",
    description:
      "If omitted, returns the hero of the whole saga. If provided, returns the hero of that particular episode.",
  }),
};

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("hero", {
      type: Character,
      args: heroArgs,
      resolve: (_, { episode }) => getHero(episode),
    });
    t.field("human", {
      type: Human,
      args: characterArgs,
      resolve: (_, { id }) => getHuman(id),
    });
    t.field("droid", {
      type: Droid,
      args: characterArgs,
      resolve: (_, { id }) => getDroid(id),
    });
  },
});
```

---

## License (MIT)

(c) 2018-2019 Tim Griesser

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
