#! /usr/bin/env -S deno run --allow-read
// Generate README.md from data/ and README.md.in.

import markdownTOC from "npm:markdown-toc";

const dataDir = "data";
const readmeTemplateFile = "README.md.in";

type Item = {
  demo: string;
  github: string;
  name: string;
  note: string;
  screenshots: string[];
  website: string;
};

if (Deno.args.length !== 0) {
  console.error("usage: generate-readme.ts");
  Deno.exit(1);
}

const readData = async (...args: string[]): Promise<string> => {
  try {
    const text = await Deno.readTextFile([dataDir, ...args].join("/"));
    return text.replace(/\n+$/, "");
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return "";
    }
    throw e;
  }
};

const renderItem = (
  { demo, github, name, note, screenshots, website }: Item,
): string => {
  const screenshotMarkdown = screenshots.map((filename) =>
    `[![${filename}](thumbnail/${filename})](screenshot/${filename})`
  ).join("\n");

  const lines: string[] = [];
  lines.push(`### ${name}`, "");
  if (note !== "") {
    lines.push(note, "");
  }
  if (website !== "") lines.push(`* [Website](${website})`);
  if (github !== "") {
    lines.push(
      `* [Repository](https://github.com/${github}) ![GitHub stars](https://img.shields.io/github/stars/${github}?style=flat-square) ` +
        `![GitHub contributors](https://img.shields.io/github/contributors-anon/${github}?style=flat-square) ` +
        `![Last commit](https://img.shields.io/github/last-commit/${github}?style=flat-square) ` +
        `![GitHub open issues](https://img.shields.io/github/issues-raw/${github}?style=flat-square) ` +
        `![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/${github}?style=flat-square)`,
    );
  }
  if (demo !== "") lines.push(`* [Demo](${demo})`);
  lines.push("", screenshotMarkdown);

  return lines.join("\n");
};

try {
  const sections: { [key: string]: string } = {};

  for await (const entry of Deno.readDir(dataDir)) {
    if (!entry.isDirectory) continue;
    const sectionDir = entry.name;
    const items: Item[] = [];

    for await (const entry of Deno.readDir(`${dataDir}/${sectionDir}`)) {
      if (!entry.isDirectory) continue;
      const itemDir = entry.name;

      const data: Item = {
        demo: await readData(sectionDir, itemDir, "demo"),
        github: await readData(sectionDir, itemDir, "github"),
        name: await readData(sectionDir, itemDir, "name"),
        note: await readData(sectionDir, itemDir, "note"),
        screenshots: (await readData(sectionDir, itemDir, "screenshots")).split(
          "\n",
        ),
        website: await readData(sectionDir, itemDir, "website"),
      };

      items.push(data);
    }

    items.sort((a, b) =>
      a["name"].toLowerCase().localeCompare(b["name"].toLowerCase())
    );
    sections[sectionDir] = items.map(renderItem).join("\n\n\n");
  }

  const template = (await Deno.readTextFile(readmeTemplateFile)).replace(
    /\n+$/,
    "",
  );
  let readme = template;

  for (const [name, markup] of Object.entries(sections)) {
    readme = readme.replace(`%${name.toUpperCase()}%`, markup);
  }
  readme = readme.replace("%TOC%", markdownTOC(readme).content);

  console.log(readme);
} catch (err) {
  console.error(err);
}
