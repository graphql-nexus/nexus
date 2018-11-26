// @ts-check
/// <reference path="./githuntTypes.ts" />
const {
  enumType,
  objectType,
  arg,
  abstractType,
  directiveType,
} = require("graphqliteral");

exports.CacheControl = directiveType("cacheControl", (t) => {
  t.int("maxAge");
  t.field("scope", "CacheControlScope");
  t.locations("OBJECT", "FIELD_DEFINITION");
});

exports.CacheControlScope = enumType("CacheControlScope", [
  "PUBLIC",
  "PRIVATE",
]);

exports.FeedType = enumType("FeedType", (t) => {
  t.description("A list of options for the sort order of the feed");
  t.member("HOT", {
    description:
      "Sort by a combination of freshness and score, using Reddit's algorithm",
  });
  t.member("NEW", { description: "Newest entries first" });
  t.member("TOP", { description: "Highest score entries first" });
});

exports.Query = objectType("Query", (t) => {
  t.field("feed", "Entry", {
    list: true,
    args: {
      type: arg("FeedType", {
        required: true,
        description: "The sort order for the feed",
      }),
      offset: arg("Int", {
        description: "The number of items to skip, for pagination",
      }),
      limit: arg("Int", {
        description:
          "The number of items to fetch starting from the offset, for pagination",
      }),
    },
    resolve(root, args, ctx) {},
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
    directives: [
      {
        name: "cacheControl",
        args: {
          scope: "PRIVATE",
        },
      },
    ],
  });
});

exports.VoteType = enumType("VoteType", (t) => {
  t.description("The type of vote to record, when submitting a vote");
  t.members(["UP", "DOWN", "CANCEL"]);
});

const RepoNameArg = arg("String", {
  required: true,
  description:
    'The full repository name from GitHub, e.g. "apollostack/GitHunt-API"',
});

exports.Mutation = objectType("Mutation", (t) => {
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
      type: arg("VoteType", {
        required: true,
        description: "The type of vote - UP, DOWN, or CANCEL",
      }),
    },
  });
  t.field("submitComment", "Comment", {
    args: {
      repoFullName: RepoNameArg,
      commentContent: t.stringArg({
        required: true,
        description: "The text content for the new comment",
      }),
    },
  });
});

const CommonFields = abstractType((t) => {
  t.int("id", { description: "The SQL ID of this entry" });
  t.field("postedBy", "User", {
    nullable: true,
    description: "The GitHub user who posted the comment",
  });
});

exports.Comment = objectType("Comment", (t) => {
  t.description("A comment about an entry, submitted by a user");
  t.directive("cacheControl", { maxAge: 240 });
  t.mix(CommonFields);
  t.float("createdAt", {
    property: "created_at",
    description: "A timestamp of when the comment was posted",
  });
  t.string("content", {
    description: "The text of the comment",
  });
  t.string("repoName", {
    description: "The repository which this comment is about",
  });
});

// 'XXX to be removed'
exports.Vote = objectType("Vote", (t) => {
  t.int("vote_value");
});

// # Information about a GitHub repository submitted to GitHunt
exports.Entry = objectType("Entry", (t) => {
  t.mix(CommonFields);
  t.directive("cacheControl", { maxAge: 240 });
  t.field("repository", "Repository", {
    description: "Information about the repository from GitHub",
  });
  t.float("createdAt", {
    description: "A timestamp of when the entry was submitted",
  });
  t.int("score", {
    description: "The score of this repository, upvotes - downvotes",
  });
  t.float("hotScore", {
    property: "hot_score",
    description: "The hot score of this repository",
  });
  t.field("comments", "Comment", {
    list: true,
    args: {
      limit: t.intArg(),
      offset: t.intArg(),
    },
    description: "Comments posted about this repository",
  });
  t.int("commentCount", {
    description: "The number of comments posted about this repository",
  });
  t.field("vote", "Vote", { description: "XXX to be changed" });
});

exports.Repository = objectType("Repository", (t) => {
  t.description(`
    A repository object from the GitHub API. This uses the exact field names returned by the
    GitHub API for simplicity, even though the convention for GraphQL is usually to camel case.
  `);
  t.directive("cacheControl", {
    maxAge: 240,
  });
  t.string("name", {
    description: "Just the name of the repository, e.g. GitHunt-API",
  });
  t.string("full_name", {
    description:
      "The full name of the repository with the username, e.g. apollostack/GitHunt-API",
  });
  t.string("description", {
    nullable: true,
    description: "The description of the repository",
  });
  t.string("html_url", { description: "The link to the repository on GitHub" });
  t.int("stargazers_count", {
    description:
      "The number of people who have starred this repository on GitHub",
  });
  t.int("open_issues_count", {
    nullable: true,
    description: "The number of open issues on this repository on GitHub",
  });
  t.field("owner", "User", {
    nullable: true,
    description: "The owner of this repository on GitHub, e.g. apollostack",
  });
});

exports.User = objectType("User", (t) => {
  t.description(
    "A user object from the GitHub API. This uses the exact field names returned from the GitHub API."
  );
  t.directive("cacheControl", {
    maxAge: 240,
  });
  t.string("login", { description: "The name of the user, e.g. apollostack" });
  t.string("avatar_url", {
    description:
      "The URL to a directly embeddable image for this user's avatar",
  });
  t.string("html_url", { description: "The URL of this user's GitHub page" });
});
