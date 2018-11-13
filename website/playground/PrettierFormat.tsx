import React from "react";
import {
  GQLiteralObject,
  GQLiteralInterface,
  GQLiteralInputObject,
  GQLiteralUnion,
  GQLiteralEnum,
  GQLiteralScalar,
  GQLiteralSchema,
  GQLiteralAbstractType,
  GQLiteralDirective,
  GQLiteralArg,
} from "gqliteral";
import { printSchema } from "graphql";

export class PrettierFormat extends React.Component {
  constructor(props) {
    super(props);
    this.state = { formatted: "", debug: {} };
  }

  componentDidMount() {
    this.format();
  }

  componentDidUpdate(prevProps) {
    for (const key of ["code", "options", "debugAst", "debugDoc", "reformat"]) {
      if (prevProps[key] !== this.props[key]) {
        this.format();
        break;
      }
    }
  }

  format() {
    const module = {};
    try {
      const fn = new Function(
        "module",
        "GQLiteralAbstractType",
        "GQLiteralObject",
        "GQLiteralInterface",
        "GQLiteralInputObject",
        "GQLiteralEnum",
        "GQLiteralUnion",
        "GQLiteralScalar",
        "GQLiteralSchema",
        "GQLiteralDirective",
        "GQLiteralArg",
        `
          "use strict";
          ${this.props.code};
        `
      );
      fn(
        module,
        GQLiteralAbstractType,
        GQLiteralObject,
        GQLiteralInterface,
        GQLiteralInputObject,
        GQLiteralEnum,
        GQLiteralUnion,
        GQLiteralScalar,
        GQLiteralSchema,
        GQLiteralDirective,
        GQLiteralArg
      );
      if (typeof module.exports !== "undefined") {
        this.setState({ formatted: printSchema(module.exports) });
      }
    } catch (e) {
      console.error(e);
    }
    // const {
    //   worker,
    //   code,
    //   options,
    //   debugAst: ast,
    //   debugDoc: doc,
    //   reformat,
    // } = this.props;

    // this.setState({ result: "hello" });
    // worker
    //   .format(code, options, { ast, doc, reformat })
    //   .then(result => this.setState(result));
  }

  render() {
    return this.props.children(this.state);
  }
}
