import dedent from "dedent";
import React from "react";
import ReactDOM from "react-dom";
import "codemirror-graphql/mode";

import { Playground } from "./Playground";

const content = dedent`
  // All GQLiteral objects are available globally here,
  // and will automatically be added to the schema

  objectType('Account', t => {
    t.implements('Node', 'Timestamps');
    t.string('email', { nullable: true });
    t.field('posts', 'Post', { 
      list: true, 
      default: () => [{id: 1}] 
    });
  });

  objectType('Post', t => {
    t.implements('Node');
    t.string('title', { default: '' });
    t.field('owner', 'Account', {
      resolve() {
        return { id: 2 }
      }
    });
  })

  objectType('Query', t => {
    t.field('account', 'Account', {
      resolve() {
        return { id: 1, email: 'test@example.com' }
      }
    });
  });

  interfaceType('Node', t => {
    t.description("A Node is a resource with a globally unique identifier");
    t.id('id', { description: "PK of the resource" });
  })

  interfaceType('Timestamps', t => {
    t.field('createdAt', 'Date', { default: () => new Date() });
    t.field('updatedAt', 'Date', { default: () => new Date() });
  });

  objectType('ZZZ_AdvancedTypes', t => {
    t.float('coordinates', {
      list: true,
      listDepth: 2,
      listItemNullable: [false, true],
      resolve: () => Promise.resolve([])
    });  
  })

  scalarType('Date', {
    serialize: value => value.getTime(),
    parseValue: value => new Date(value),
    parseLiteral: ast => ast.kind === "IntValue" ? new Date(ast.value) : null
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
