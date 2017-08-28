#!/usr/bin/env node

const fs = require("fs");
const glob = require("glob");
const mkdirp = require("mkdirp");
const path = require("path");
const yargs = require("yargs");
const { parse } = require("..");

const args = Object.assign(
  {
    out: "out",
    src: "src/**/*.html"
  },
  yargs.argv
);

function makeOutFileName(file) {
  return path.basename(file);
}

mkdirp(args.out);
glob(args.src, (err, inFiles) => {
  inFiles.forEach(inFile => {
    const outFile = path.join(args.out, makeOutFileName(inFile));
    const { body, sfc } = parse(inFile);
    const outFileName = sfc ? outFile.replace(".html", ".js") : outFile;
    fs.writeFile(outFileName, body, () =>
      console.log(`${inFile} -> ${outFile}`)
    );
  });
});
