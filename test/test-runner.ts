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
  } catch (error) {
    await unlink(executable);
    console.log(error.stdout || error.toString());
    process.exit(1);
  }

  await unlink(executable);
}

async function main() {
  try {
    const unitTests = fs.readdirSync(path.join(__dirname, "unit")).filter((file) => file.endsWith(".ts"));

    await Promise.all(unitTests.map(runUnitTest));

    console.log(`All ${unitTests.length} tests passed.`);
  } catch (error) {
    console.log(error.stdout || error.toString());
    process.exit(1);
  }
}

main();
