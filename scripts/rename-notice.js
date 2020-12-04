const ansi = {
  bold: (str) => `\u001b[1m${str}${ansi.reset}`,
  yellow: (str) => `\u001b[33m${str}${ansi.reset}`,
  reset: '\u001b[0m',
}

process.stdout.write(`\
${ansi.yellow(ansi.bold("WARNING: '@nexus/schema' will be renamed to 'nexus' on December 14th."))}
${ansi.yellow(ansi.bold("WARNING: '@nexus/schema' will be renamed to 'nexus' on December 14th."))}
${ansi.yellow(ansi.bold("WARNING: '@nexus/schema' will be renamed to 'nexus' on December 14th."))}

0.20.x will be the last versions published on the '@nexus/schema' package.
Starting December 14th, future updates will be published to 'nexus@^1.0.0'.
`)
