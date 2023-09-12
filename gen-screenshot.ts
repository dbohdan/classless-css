#! /usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-run --allow-write --check
// Generate the screenshot and its thumbnail for a project.
// To install the dependencies on Debian/Ubuntu:
// $ sudo apt install imagemagick optipng

import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const templateFile = "screenshot-page.html";
const temporaryFile = "temp.html";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");

const saveScreenshot = async (src: string, dest: string) => {
  // For whatever reason, I get screenshots 16 pixels wider than the requested
  // viewport size.
  const browser = await puppeteer.launch({
    defaultViewport: { width: 1024 - 16, height: 1024, deviceScaleFactor: 1 }
  });
  const page = await browser.newPage();

  await page.goto(src);
  await page.screenshot({ fullPage: true, path: dest });

  await browser.close();
};

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

  const tempFilePath = await Deno.realPath(temporaryFile);
  await saveScreenshot(`file://${tempFilePath}`, `screenshot/${screenshotFile}`);

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
