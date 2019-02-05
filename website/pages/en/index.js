const React = require("react");
const CompLibrary = require("../../core/CompLibrary.js");

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const siteConfig = require(`${process.cwd()}/siteConfig.js`);

function imgUrl(img) {
  return `${siteConfig.baseUrl}img/${img}`;
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? `${language}/` : "") + page;
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: "_self",
};

const SplashContainer = (props) => (
  <div className="homeContainer">
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{props.children}</div>
    </div>
  </div>
);

const Logo = (props) => (
  <div className="projectLogo">
    <img src={props.img_src} alt="Project Logo" />
  </div>
);

const ProjectTitle = () => (
  <h2 className="projectTitle">
    {siteConfig.title}
    <small>{siteConfig.tagline}</small>
  </h2>
);

const PromoSection = (props) => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
);

class HomeSplash extends React.Component {
  render() {
    const language = this.props.language || "";
    return (
      <SplashContainer>
        <div className="inner">
          <img src="https://i.imgur.com/Y5BgDGl.png" width="150" />
          <ProjectTitle />
          <PromoSection>
            <Button href={pageUrl("docs/getting-started", language)}>
              Getting Started
            </Button>
            <Button href="https://github.com/graphql-nexus/nexus/tree/develop/examples">
              Examples
            </Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

const Block = (props) => (
  <Container
    padding={["bottom", "top"]}
    id={props.id}
    background={props.background}
  >
    <GridBlock
      align={props.align}
      contents={props.children}
      layout={props.layout}
    />
  </Container>
);

class Index extends React.Component {
  render() {
    const language = this.props.language || "";
    return (
      <div>
        <HomeSplash language={language} />
        <Block layout="threeColumn" background="light" align="center">
          {[
            {
              title: "Type-Safe by Default",
              image: imgUrl("tsjs.png"),
              imageAlign: "top",
              content:
                `GraphQL Nexus' APIs were designed with type-safety in mind. We auto-generate type-definitions as you develop, ` +
                `and infer them in your code, giving you IDE completion and type error catching out of the box!`,
            },
            {
              title: "Works With The Ecosystem",
              image: imgUrl("graphql-logo.png"),
              imageAlign: "top",
              content:
                `Nexus can work with existing graphql-js types when constructing its schema. ` +
                `The generated schema works with your favorite tools like Apollo Server or GraphQL middleware.`,
            },
            {
              title: "Data-Agnostic",
              image: imgUrl("database.png"),
              imageAlign: "top",
              content:
                `GraphQL Nexus is just a declarative syntax layered on the graphql-js library. Whatever ` +
                `you can do with graphql-js or apollo-tools, you can do with Nexus.`,
            },
          ]}
        </Block>
        <Block background="dark">
          {[
            {
              title: "Automatic Type Inference (even in JS!)",
              image: imgUrl("type-inference.png"),
              imageAlign: "right",
              content:
                `Automatically generates and infers types based on the schema. No need to manually add ` +
                `annotations, Nexus can automatically infer them in TypeScript using [global declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) ` +
                `and [conditional type inference](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-inference-in-conditional-types).`,
              textAlign: "left",
            },
          ]}
        </Block>
        <Block id="try">
          {[
            {
              title: "Autocompletion on Type Names",
              content:
                `For association type fields, you can either import types you've created, or just supply their ` +
                `names as strings... with free autocomplete! Nexus keeps track of the type names in your schema and provides them ` +
                `to the type-system, so you know what you can use at various positions in your schema.`,
              image: imgUrl("autocomplete.png"),
              imageAlign: "left",
            },
          ]}
        </Block>
        <Block background="light">
          {[
            {
              title: "SDL -> Nexus Converter",
              image: imgUrl("converter.png"),
              content:
                "Try the automatic [SDL converter](/converter) to convert an existing schema into Nexus code",
              imageAlign: "right",
            },
          ]}
        </Block>
      </div>
    );
  }
}

module.exports = Index;
