import "module-alias/register";
import { replaceOrAddExtension } from "@utils";
import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { flatten, last } from "lodash";
const execFile = promisify(child_process.execFile);

const TEST_OUT_DIR = path.join(__dirname, "../test_out");

function cleanup() {
  const files = fs.readdirSync(TEST_OUT_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(TEST_OUT_DIR, file));
  }
  fs.rmdirSync(TEST_OUT_DIR);
}

async function runUnitTest(file: string) {
  const compilerPath = path.join(__dirname, "..", "src", "main.ts");

  const executable = path.join(TEST_OUT_DIR, replaceOrAddExtension(last(file.split(path.sep))!, ""));
  const compileCommand = ["ts-node", compilerPath, file, "--output", executable];
  await execFile(compileCommand[0], compileCommand.slice(1));
  try {
    await execFile(executable);
  } catch (error) {
    console.log(error.stdout || error.toString());
    cleanup();
    process.exit(1);
  }
}

function getTests(directory: string): string[] {
  const nestedDirents = fs.readdirSync(directory, { withFileTypes: true });
  const tests = nestedDirents.map((value) => {
    return value.isDirectory() ? getTests(path.join(directory, value.name)) : path.join(directory, value.name);
  });
  return flatten(tests).filter((filename) => !filename.endsWith(".d.ts") && filename.endsWith(".ts"));
}

async function main() {
  try {
    if (fs.existsSync(TEST_OUT_DIR)) {
      cleanup();
    }

    fs.mkdirSync(TEST_OUT_DIR);

    const unitTests = getTests(path.join(__dirname, "unit"));

    await Promise.all(unitTests.map(runUnitTest));

    console.log(`All ${unitTests.length} tests passed.`);
  } catch (error) {
    console.log(error.stdout || error.toString());
    cleanup();
    process.exit(1);
  } finally {
    cleanup();
  }
}

main();
