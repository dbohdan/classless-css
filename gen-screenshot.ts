#! /usr/bin/env node
// Generate the screenshot and its thumbnail for a project.
// To install the dependencies on Debian/Ubuntu:
// $ sudo apt install imagemagick optipng
// $ PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries/playwright \
//     npx playwright install chromium

import { chromium } from "playwright";
import { readFile, realpath, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const templateFile = "screenshot-page.html";
const temporaryFile = "temp.html";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");

const saveScreenshot = async (src: string, dest: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 1024 });
  await page.goto(src);

  await page.screenshot({ path: dest, fullPage: true });

  await browser.close();
};

const run = (command: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on(
      "exit",
      (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`${command} exited with code ${code}`)),
    );
  });

if (process.argv.length < 3 || process.argv.length > 4) {
  console.error(
    "usage: gen-screenshot.ts project-name [css-file]\n\n" +
      "The image filename will be derived from the project name.",
  );
  process.exit(1);
}

const screenshotFile = `${slugify(process.argv[2])}.png`;
const cssFile = process.argv[3] || "";

try {
  const htmlTemplate = await readFile(templateFile, "utf8");
  const css = cssFile === "" ? "" : await readFile(cssFile, "utf8");
  const html = htmlTemplate.replace(/%CSS_HERE%/, css);
  await writeFile(temporaryFile, html);

  const tempFilePath = await realpath(temporaryFile);
  await saveScreenshot(
    `file://${tempFilePath}`,
    `screenshot/${screenshotFile}`,
  );

  await run(
    "convert",
    [
      "-resize",
      "25%",
      "-adaptive-sharpen",
      "10",
      `screenshot/${screenshotFile}`,
      `thumbnail/${screenshotFile}`,
    ],
  );

  await run("optipng", [
    "-o",
    "5",
    "-strip",
    "all",
    `screenshot/${screenshotFile}`,
    `thumbnail/${screenshotFile}`,
  ]);
} catch (err) {
  console.error(err);
} finally {
  await rm(temporaryFile, { force: true });
}
