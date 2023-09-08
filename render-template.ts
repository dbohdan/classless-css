#! /usr/bin/env -S deno run --allow-read --check

import markdownTOC from "npm:markdown-toc@1";
import nunjucks from "npm:nunjucks@3";
import TOML from "npm:@iarna/toml@3";

if (Deno.args.length !== 2) {
  console.error("usage: render-template.ts template.njk data.toml");
  Deno.exit(1);
}
const [templatePath, dataPath] = Deno.args;

interface INamedProject {
  name: string;
  [key: string]: string;
}

interface IProjects {
  [key: string]: {
    [key: string]: string;
  };
}

const projList = (projects: IProjects): INamedProject[] =>
  Object.entries(projects)
    .map(([name, info]) =>
      Object.assign({
        name,
      }, info)
    );

try {
  const template = (await Deno.readTextFile(templatePath)).trim();
  const data = TOML.parse(await Deno.readTextFile(dataPath));

  const tocToken = `%TOC-${Math.random()}%`;
  const env = new nunjucks.configure({
    lstripBlocks: true,
    trimBlocks: true,
  }).addGlobal("toc", tocToken);
  const doc = env.renderString(template, {
    projects: projList(<IProjects> data),
  });

  const headingFilter = (str: string) => !str.match(/Contents/);
  const toc = markdownTOC(doc, {
    filter: headingFilter,
  }).content;
  const docWithTOC = doc.replace(tocToken, toc);

  console.log(docWithTOC);
} catch (err) {
  console.error(err);
}
