import "module-alias/register";
import { replaceOrAddExtension } from "@utils";
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
const execFile = promisify(child_process.execFile);
const unlink = promisify(fs.unlink);

async function runUnitTest(file: string) {
  const compilerPath = path.join(__dirname, "..", "src", "main.ts");
  const inputFile = path.join(__dirname, "unit", file);

  const compileCommand = ["ts-node", compilerPath, inputFile];
  await execFile(compileCommand[0], compileCommand.slice(1));
  const executable = path.join(__dirname, "..", replaceOrAddExtension(file, ""));
  try {
    await execFile(executable);
  } finally {
    await unlink(executable);
  }

  return undefined;
}

async function main() {
  try {
    let unitTests = [];
    let failedUnitTests = [];

    unitTests = fs.readdirSync(path.join(__dirname, "unit")).filter((file) => file.endsWith(".ts"));
    failedUnitTests = (await Promise.all(unitTests.map(runUnitTest))).filter(Boolean);

    if (failedUnitTests.length > 0) {
      process.exit(1);
    }

    console.log(`All ${unitTests.length} tests passed.`);
  } catch (error) {
    console.log(error.stdout || error.toString());
    process.exit(1);
  }
}

main();
