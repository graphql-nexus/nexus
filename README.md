## GQLit

Literate, strongly typed GraphQL schema construction for JavaScript.

Combines the best practices in building out a GraphQL server layer without the boilerplate.

Inspired by real-world use of graphql-js, apollo, graphene, and graphql-ruby.

Provides full control of your schema, with added benefits like dynamic schemas based on user permissions. Check out the `/examples` for some sample uses.

### Features:

**_ Type combination _**

Ever have a situation where your input types look eerily simliar to your output types, yet you need to define them both by hand in the schema? Or maybe you have an interface shared by several types, and each time you add a field to the interface you need to remember to add it to the types.

**_ No circular reference issues _**

One of the problems with GraphQL construction is the self-referential types and the

**_ Awesome intellisense _**

Leverages type generation internally so you don't have to.

**_ Great error messages _**

We want you to know where things went wrong, not spend time trying to figure out cryptic error messages.

### Non-goals:

Opinions on resolvers.

### Type combination

Ever notice that your input types and output types are usually fairly similar? Maybe the

### API:

#### GQLitType

#### GQLitInputType

####
