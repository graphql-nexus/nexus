import React from "react";
import {
  GQLiteralObject,
  GQLiteralInterface,
  GQLiteralInputObject,
  GQLiteralUnion,
  GQLiteralEnum,
  GQLiteralScalar,
} from "gqliteral";

export default class PrettierFormat extends React.Component {
  constructor() {
    super();
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
    const fnArgs = [
      "module",
      "GQLiteralObject",
      "GQLiteralInterface",
      "GQLiteralInputObject",
      "GQLiteralEnum",
      "GQLiteralUnion",
      "GQLiteralScalar",
      this.props.code,
    ];
    const fn = new Function(fnArgs);
    const module = {};
    fn(
      module,
      GQLiteralObject,
      GQLiteralInterface,
      GQLiteralInputObject,
      GQLiteralEnum,
      GQLiteralUnion,
      GQLiteralScalar
    );
    debugger;

    const {
      worker,
      code,
      options,
      debugAst: ast,
      debugDoc: doc,
      reformat,
    } = this.props;

    this.setState({ result: "hello" });
    // worker
    //   .format(code, options, { ast, doc, reformat })
    //   .then(result => this.setState(result));
  }

  render() {
    return this.props.children(this.state);
  }
}
