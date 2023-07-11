#! /usr/bin/env -S deno run --allow-run --allow-read --allow-write
// Generate the screenshot and its thumbnail for a project.
// To install the dependencies on Debian/Ubuntu:
// $ sudo apt install imagemagick optipng wkhtmltopdf

const templateFile = "screenshot-page.html";
const temporaryFile = "temp.html";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");

if (Deno.args.length !== 2) {
  console.error("usage: generate-screenshot.ts name css-file");
  Deno.exit(1);
}

const screenshotFile = `${slugify(Deno.args[0])}.png`;
const cssFile = Deno.args[1];

try {
  const htmlTemplate = await Deno.readTextFile(templateFile);
  const css = await Deno.readTextFile(cssFile);
  const html = htmlTemplate.replace(/%CSS_HERE%/, css);
  await Deno.writeTextFile(temporaryFile, html);

  await Deno.run({
    cmd: ["wkhtmltoimage", temporaryFile, `screenshot/${screenshotFile}`],
  }).status();
  await Deno.run({
    cmd: [
      "convert",
      "-resize",
      "25%",
      "-adaptive-sharpen",
      "10",
      `screenshot/${screenshotFile}`,
      `thumbnail/${screenshotFile}`,
    ],
  }).status();
  await Deno.run({
    cmd: [
      "optipng",
      "-o",
      "5",
      "-strip",
      "all",
      `screenshot/${screenshotFile}`,
      `thumbnail/${screenshotFile}`,
    ],
  }).status();
} catch (err) {
  console.error(err);
} finally {
  Deno.remove(temporaryFile);
}
