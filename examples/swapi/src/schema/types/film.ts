import { GQLiteralObject } from "../../../../../src";

export const Film = GQLiteralObject("Film", t => {
  t.description("A single film");
  t.string("title", { description: "The title of the film" });
  t.int("episodeID", {
    description: "The episode number of this film.",
    property: "episode_id",
  });
  t.string("openingCrawl", {
    description: "The opening paragraphs at the beginning of this film.",
  });
  t.string("director", {
    description: "The name of the director of this film.",
  });
  t.list("producers", "String", {
    description: "The name(s) of the producer(s) of this film.",
    resolve: film => {
      return film.producer.split(",").map((s: string) => s.trim());
    },
  });
  t.string("releaseDate", {
    property: "release_date",
    description:
      "The ISO 8601 date format of film release at original creator country.",
  });
  t.field("speciesConnection", "FilmSpeciesConnection");
  t.field("starshipConnection", "StarshipConnection");
  t.field("starshipConnection", "StarshipConnection");
});
