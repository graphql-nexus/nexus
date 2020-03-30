// @ts-check
const {
  enumType,
  objectType,
  arg,
  intArg,
  stringArg,
} = require("@nexus/schema");

exports.FeedType = enumType({
  name: "FeedType",
  description: "A list of options for the sort order of the feed",
  members: [
    {
      name: "HOT",
      description:
        "Sort by a combination of freshness and score, using Reddit's algorithm",
    },
    { name: "NEW", description: "Newest entries first" },
    { name: "TOP", description: "Highest score entries first" },
  ],
});

exports.Query = objectType({
  name: "Query",
  definition(t) {
    t.list.field("feed", {
      type: "Entry",
      args: {
        type: arg({
          type: "FeedType",
          required: true,
          description: "The sort order for the feed",
        }),
        offset: intArg({
          description: "The number of items to skip, for pagination",
        }),
        limit: intArg({
          description:
            "The number of items to fetch starting from the offset, for pagination",
        }),
      },
      resolve(root, args, ctx) {
        return [];
      },
    });
    t.field("entry", {
      type: "Entry",
      nullable: true,
      description: "A single entry",
      args: {
        repoFullName: stringArg({
          required: true,
          description:
            'The full repository name from GitHub, e.g. "apollostack/GitHunt-API"',
        }),
      },
    });
    t.field("currentUser", {
      type: "User",
      description:
        "Return the currently logged in user, or null if nobody is logged in",
      nullable: true,
      resolve() {
        return null;
      },
    });
  },
});

exports.VoteType = enumType({
  name: "VoteType",
  description: "The type of vote to record, when submitting a vote",
  members: ["UP", "DOWN", "CANCEL"],
});

const RepoNameArg = stringArg({
  required: true,
  description:
    'The full repository name from GitHub, e.g. "apollostack/GitHunt-API"',
});

exports.Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.field("submitRepository", {
      type: "Entry",
      description: "Submit a new repository, returns the new submission",
      args: {
        repoFullName: RepoNameArg,
      },
      resolve() {
        // todo
      },
    });
    t.field("vote", {
      type: "Entry",
      description:
        "Vote on a repository submission, returns the submission that was voted on",
      args: {
        repoFullName: RepoNameArg,
        type: arg({
          type: "VoteType",
          required: true,
          description: "The type of vote - UP, DOWN, or CANCEL",
        }),
      },
      resolve() {
        // todo
      },
    });
    t.field("submitComment", {
      type: "Comment",
      args: {
        repoFullName: RepoNameArg,
        commentContent: stringArg({
          required: true,
          description: "The text content for the new comment",
        }),
      },
      resolve() {
        // todo
      },
    });
  },
});

/**
 * Example of using functions to mixin fields across types
 * @type {(t: import('@nexus/schema').core.ObjectDefinitionBlock<any>) => void}
 */
const commonFields = (t) => {
  t.int("id", { description: "The SQL ID of this entry" });
  t.field("postedBy", {
    type: "User",
    nullable: true,
    description: "The GitHub user who posted the comment",
  });
};

exports.Comment = objectType({
  name: "Comment",
  description: "A comment about an entry, submitted by a user",
  definition(t) {
    commonFields(t);
    t.float("createdAt", {
      resolve: (o) => o.created_at,
      description: "A timestamp of when the comment was posted",
    });
    t.string("content", {
      description: "The text of the comment",
    });
    t.string("repoName", {
      description: "The repository which this comment is about",
    });
  },
});

// 'XXX to be removed'
exports.Vote = objectType({
  name: "Vote",
  definition(t) {
    t.int("vote_value");
  },
});

// # Information about a GitHub repository submitted to GitHunt
exports.Entry = objectType({
  name: "Entry",
  definition(t) {
    commonFields(t);
    t.field("repository", {
      type: "Repository",
      description: "Information about the repository from GitHub",
    });
    t.float("createdAt", {
      description: "A timestamp of when the entry was submitted",
    });
    t.int("score", {
      description: "The score of this repository, upvotes - downvotes",
    });
    t.float("hotScore", {
      resolve: (o) => o.hot_score,
      description: "The hot score of this repository",
    });
    t.list.field("comments", {
      type: "Comment",
      args: {
        limit: intArg(),
        offset: intArg(),
      },
      description: "Comments posted about this repository",
    });
    t.int("commentCount", {
      description: "The number of comments posted about this repository",
    });
    t.field("vote", { type: "Vote", description: "XXX to be changed" });
  },
});

exports.Repository = objectType({
  name: "Repository",
  description: `
    A repository object from the GitHub API. This uses the exact field names returned by the
    GitHub API for simplicity, even though the convention for GraphQL is usually to camel case.
  `,
  definition(t) {
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
    t.string("html_url", {
      description: "The link to the repository on GitHub",
    });
    t.int("stargazers_count", {
      description:
        "The number of people who have starred this repository on GitHub",
    });
    t.int("open_issues_count", {
      nullable: true,
      description: "The number of open issues on this repository on GitHub",
    });
    t.field("owner", {
      type: "User",
      nullable: true,
      description: "The owner of this repository on GitHub, e.g. apollostack",
    });
  },
});

exports.User = objectType({
  name: "User",
  description:
    "A user object from the GitHub API. This uses the exact field names returned from the GitHub API.",
  definition(t) {
    t.string("login", {
      description: "The name of the user, e.g. apollostack",
    });
    t.string("avatar_url", {
      description:
        "The URL to a directly embeddable image for this user's avatar",
    });
    t.string("html_url", { description: "The URL of this user's GitHub page" });
  },
});
