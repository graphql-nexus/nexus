import React, { useState } from "react";
import dedent from "dedent";

import { Button } from "./buttons";
import EditorState from "./EditorState";
import { DebugPanel, InputPanel, OutputPanel } from "./panels";
import PrettierFormat from "./PrettierFormat";
import { shallowEqual } from "./helpers";
import * as urlHash from "./urlHash";
import * as util from "./util";

import { Sidebar, SidebarCategory } from "./sidebar/components";
import { Checkbox } from "./sidebar/inputs";

const originalContent = dedent`
  // Already imported / available
  // import { 
  //   GQLiteralObject, GQLiteralInterface, GQLiteralInputObject,
  //   GQLiteralEnum, GQLiteralUnion, GQLiteralScalar
  // } from 'gqliteral'

  const Node = GQLiteralInterface('Node', t => {
    t.id('id', {
      description: "A Node is a resource with a globally unique identifier"
    })
  })

  const Account = GQLiteralObject('Account', t => {
    t.implements('Node');
    t.string('email');
  });

  const server = GQLiteralServer({
    types: [Node, Account] // this could also be { Node, Account }
  })

  // Keep this here so we don't need to run through an additional parsing layer
  module.exports = server;
`;

export class Playground extends React.Component {
  constructor(props) {
    super(props);
    const content = originalContent;
    const original = urlHash.read();

    this.state = { content, options: {} };

    this.setContent = (content) => this.setState({ content });
    this.clearContent = this.setContent.bind(this, "");
  }

  // componentDidUpdate(_, prevState) {
  //   const { content, options } = this.state;
  //   if (
  //     !shallowEqual(prevState.options, this.state.options) ||
  //     prevState.content !== content
  //   ) {
  //     urlHash.replace({ content, options });
  //   }
  // }

  render() {
    const { worker } = this.props;
    const { content, options } = this.state;

    return (
      <EditorState>
        {(editorState) => (
          <PrettierFormat
            worker={worker}
            code={content}
            options={options}
            debugAst={editorState.showAst}
            debugDoc={editorState.showDoc}
            reformat={editorState.showSecondFormat}
          >
            {({ formatted, debug }) => (
              <>
                <div className="editors-container">
                  <Sidebar visible={editorState.showSidebar}>
                    <SidebarCategory title="Info">
                      <label>
                        External imports are not currently supported.
                      </label>
                    </SidebarCategory>
                    <SidebarCategory title="Debug">
                      <Checkbox
                        label="show AST"
                        checked={editorState.showAst}
                        onChange={editorState.toggleAst}
                      />
                      <Checkbox
                        label="show second format"
                        checked={editorState.showSecondFormat}
                        onChange={editorState.toggleSecondFormat}
                      />
                    </SidebarCategory>
                  </Sidebar>
                  <div className="editors">
                    <InputPanel
                      mode={util.getCodemirrorMode(options.parser)}
                      ruler={options.printWidth}
                      value={content}
                      codeSample={""}
                      overlayStart={options.rangeStart}
                      overlayEnd={options.rangeEnd}
                      onChange={this.setContent}
                    />
                    {editorState.showAst ? (
                      <DebugPanel value={debug.ast || ""} />
                    ) : null}
                    {editorState.showDoc ? (
                      <DebugPanel value={debug.doc || ""} />
                    ) : null}
                    <OutputPanel
                      mode={util.getCodemirrorMode(options.parser)}
                      value={formatted}
                      ruler={options.printWidth}
                    />
                    {editorState.showSecondFormat ? (
                      <OutputPanel
                        mode={util.getCodemirrorMode(options.parser)}
                        value={getSecondFormat(formatted, debug.reformatted)}
                        ruler={options.printWidth}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="bottom-bar">
                  <div className="bottom-bar-buttons">
                    <Button onClick={editorState.toggleSidebar}>
                      {editorState.showSidebar ? "Hide" : "Show"} options
                    </Button>
                    <Button onClick={this.clearContent}>Clear</Button>
                  </div>
                </div>
              </>
            )}
          </PrettierFormat>
        )}
      </EditorState>
    );
  }
}

function getSecondFormat(formatted, reformatted) {
  return formatted === ""
    ? ""
    : formatted === reformatted
      ? "✓ Second format is unchanged."
      : reformatted;
}
