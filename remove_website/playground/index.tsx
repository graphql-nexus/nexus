import dedent from "dedent";
import React from "react";
import ReactDOM from "react-dom";

import { Playground } from "./Playground";

const content = dedent`
  // All nexus.js objects are available globally here,
  // and will automatically be added to the schema

  const Account = objectType({
    name: 'Account', 
    definition(t) {
      t.implements(NodeType, Timestamps);
      t.string('email', { nullable: true });
      t.list.field('posts', { 
        type: 'Post', 
        resolve: () => [{id: 1}] 
      });
    }
  });

  const Post = objectType({
    name: 'Post', 
    definition(t) {
      t.implements(NodeType);
      t.string('title', (o) => o.title || '');
      t.field('owner', {
        type: 'Account',
        resolve() {
          return { id: 2 }
        }
      });
    }
  })

  const Query = objectType({
    name: 'Query', 
    definition(t) {
      t.field('account', {
        type: Account,
        resolve() {
          return { id: 1, email: 'test@example.com' }
        }
      });
    }
  });

  const Timestamps = interfaceType({
    name: 'Timestamps', 
    definition(t) {
      t.date('createdAt', () => new Date());
      t.date('updatedAt', () => new Date());
      t.resolveType(() => null)
    }
  });

  const NodeType = interfaceType({
    name: 'Node', 
    description: "A Node is a resource with a globally unique identifier",
    definition(t) {
      t.id('id', { 
        description: "PK of the resource",
        resolve(root, args, ctx, info) {
          return ${"`${info.parentType.name}:${root.id}`"}
        }
      });
      t.resolveType(() => null)
    }
  })

  scalarType({
    name: 'Date',
    serialize: value => value.getTime(),
    parseValue: value => new Date(value),
    parseLiteral: ast => ast.kind === "IntValue" ? new Date(ast.value) : null,
    asNexusMethod: 'date'
  });
`;

const initialQuery = dedent`
  {
    account {
      id
      email
      createdAt
      posts {
        id
        owner {
          id
        }
      }
    }
  }
`;

ReactDOM.render(
  <Playground initialSchema={content} initialQuery={initialQuery} />,
  document.getElementById("root")
);
