const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const DocsSidebar = require("../../core/DocsSidebar.js");
const { ApiDocs, ApiSidebar } = require(`${process.cwd()}/api/dist/ApiDocs.js`);

const Container = CompLibrary.Container;

class ApiReference extends React.Component {
  render() {
    return (
      <div className="docMainWrapper wrapper">
        <DocsSidebar
          metadata={{
            language: "en",
            category: "Documentation",
            sidebar: "docs",
          }}
        />
        <Container className="mainContainer documentContainer postContainer fakeContainer">
          <ApiDocs />
        </Container>
        <ApiSidebar />
      </div>
    );
  }
}

module.exports = ApiReference;
