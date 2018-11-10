// @ts-check
const { GQLiteralEnum, GQLiteralObject, GQLiteralArg } = require("gqliteral");

exports.FeedType = GQLiteralEnum("FeedType", (t) => {
  t.description("A list of options for the sort order of the feed");
  t.member("HOT", {
    description:
      "Sort by a combination of freshness and score, using Reddit's algorithm",
  });
  t.member("NEW", { description: "Newest entries first" });
  t.member("TOP", { description: "Highest score entries first" });
});

exports.Query = GQLiteralObject("Query", (t) => {
  t.field("feed", "Entry", {
    list: true,
    args: {
      type: GQLiteralArg("FeedType", {
        required: true,
        description: "The sort order for the feed",
      }),
      offset: GQLiteralArg("Int", {
        description: "The number of items to skip, for pagination",
      }),
      limit: GQLiteralArg("Int", {
        description:
          "The number of items to fetch starting from the offset, for pagination",
      }),
    },
  });
  t.field("entry", "Entry", {
    nullable: true,
    description: "A single entry",
    args: {
      repoFullName: {
        type: "String",
        required: true,
        description:
          'The full repository name from GitHub, e.g. "apollostack/GitHunt-API"',
      },
    },
  });
  t.field("currentUser", "User", {
    description:
      "Return the currently logged in user, or null if nobody is logged in",
  });
});

exports.VoteType = GQLiteralEnum("VoteType", (t) => {
  t.description("The type of vote to record, when submitting a vote");
  t.members(["UP", "DOWN", "CANCEL"]);
});

const RepoNameArg = GQLiteralArg("String", {
  required: true,
  description:
    'The full repository name from GitHub, e.g. "apollostack/GitHunt-API"',
});

exports.Mutation = GQLiteralObject("Mutation", (t) => {
  t.field("submitRepository", "Entry", {
    description: "Submit a new repository, returns the new submission",
    args: {
      repoFullName: RepoNameArg,
    },
  });
  t.field("vote", "Entry", {
    description:
      "Vote on a repository submission, returns the submission that was voted on",
    args: {
      repoFullName: RepoNameArg,
      type: GQLiteralArg("VoteType", {
        required: true,
        description: "The type of vote - UP, DOWN, or CANCEL",
      }),
    },
  });
  t.field("submitComment", "Comment", {});
});

// type Mutation {
//   # Comment on a repository, returns the new comment
//   submitComment(
//     # The full repository name from GitHub, e.g. "apollostack/GitHunt-API"
//     repoFullName: String!
//     # The text content for the new comment
//     commentContent: String!
//   ): Comment
// }

// # A comment about an entry, submitted by a user
// type Comment @cacheControl(maxAge: 240) {
//   # The SQL ID of this entry
//   id: Int!
//   # The GitHub user who posted the comment
//   postedBy: User
//   # A timestamp of when the comment was posted
//   createdAt: Float! # Actually a date
//   # The text of the comment
//   content: String!
//   # The repository which this comment is about
//   repoName: String!
// }

// # XXX to be removed
// type Vote {
//   vote_value: Int!
// }

// # Information about a GitHub repository submitted to GitHunt
// type Entry @cacheControl(maxAge: 240) {
//   # Information about the repository from GitHub
//   repository: Repository
//   # The GitHub user who submitted this entry
//   postedBy: User
//   # A timestamp of when the entry was submitted
//   createdAt: Float! # Actually a date
//   # The score of this repository, upvotes - downvotes
//   score: Int!
//   # The hot score of this repository
//   hotScore: Float!
//   # Comments posted about this repository
//   comments(limit: Int, offset: Int): [Comment]!
//   # The number of comments posted about this repository
//   commentCount: Int!
//   # The SQL ID of this entry
//   id: Int!
//   # XXX to be changed
//   vote: Vote!
// }

// schema {
//   query: Query
//   mutation: Mutation
//   subscription: Subscription
// }
