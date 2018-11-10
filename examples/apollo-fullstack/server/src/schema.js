// @ts-check
const { GQLiteralObject, GQLiteralEnum, GQLiteralArg } = require("gqliteral");

exports.Query = GQLiteralObject("Query", (t) => {
  t.field("launches", "LaunchConnection", {
    list: true,
    args: {
      pageSize: GQLiteralArg("Int", {
        description:
          "The number of results to show. Must be >= 1. Default = 20",
      }),
      after: GQLiteralArg("String", {
        description:
          "If you add a cursor here, it will only return results _after_ this cursor",
      }),
    },
  });
  t.field("launch", "Launch", {
    args: {
      id: GQLiteralArg("ID", { required: true }),
    },
  });
  t.field("me", "User", { nullable: true });
});

exports.Mutation = GQLiteralObject("Mutation", (t) => {
  t.field("bookTrips", TripUpdateResponse, {
    args: {
      launchIds: GQLiteralArg("ID", { list: true, required: true }),
    },
  });
  t.field("cancelTrip", "TripUpdateResponse", {
    args: {
      launchId: GQLiteralArg("ID", { required: true }),
    },
  });
  t.string("login", {
    args: {
      email: GQLiteralArg("String"),
    },
  });
});

exports.TripUpdateResponse = GQLiteralObject("TripUpdateResponse", (t) => {
  t.boolean("success");
  t.string("message", { nullable: true });
  t.field("launches", "Launch", { nullable: true });
});

exports.LaunchConnection = GQLiteralObject("LaunchConnection", (t) => {
  t.description(`
    Simple wrapper around our list of launches that contains a cursor to the
    last item in the list. Pass this cursor to the launches query to fetch results
    after these.
  `);
  t.string("cursor");
  t.boolean("hasMore");
  t.field("launches", "Launch", { list: true, listItemNullable: true });
});

exports.Launch = GQLiteralObject("Launch", (t) => {
  t.id("id");
  t.string("site", { nullable: true });
  t.field("mission", "Mission");
  t.field("rocket", "Rocket");
  t.boolean("isBooked");
});

exports.Rocket = GQLiteralObject("Rocket", (t) => {
  t.id("id");
  t.string("name", { nullable: true });
  t.string("type", { nullable: true });
});

exports.User = GQLiteralObject("User", (t) => {
  t.id("id");
  t.string("email");
  t.field("trips", "Launch", { list: true });
});

exports.Mission = GQLiteralObject("Mission", (t) => {
  t.string("name", { nullable: true });
  t.string("missionPatch", {
    args: {
      size: "PatchSize",
    },
  });
});
