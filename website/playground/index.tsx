import "codemirror-graphql/mode";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import { Playground } from "./Playground";
import { VersionLink } from "./VersionLink";
import { workerApi } from "./WorkerApi";

const App = () => {
  return (
    <>
      <VersionLink version={"1.0.1"} />
      <Playground version={"1.0.1"} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
