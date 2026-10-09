#! /usr/bin/env node

import markdownTOC from "markdown-toc";
import nunjucks from "nunjucks";
import TOML from "@iarna/toml";
import { readFile } from "node:fs/promises";

if (process.argv.length !== 4) {
  console.error("usage: render-template.ts template.njk data.toml");
  process.exit(1);
}
const [, , templatePath, dataPath] = process.argv;

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
  const template = (await readFile(templatePath, "utf8")).trim();
  const data = TOML.parse(await readFile(dataPath, "utf8"));

  const tocToken = `%TOC-${Math.random()}%`;
  const env = nunjucks.configure({
    lstripBlocks: true,
    trimBlocks: true,
  });
  env.addGlobal("toc", tocToken);
  const doc = env.renderString(template, {
    projects: projList(data as IProjects),
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
