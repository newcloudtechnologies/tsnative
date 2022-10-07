/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import argv from "commander";

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');

const testDir = path.join(__dirname, "/cases/basic");

argv
  .option("--source [value]", "specify source to execute")
  .parse(process.argv);

class Runner {
  private stdout: string = "";
  private stderr: string = "";

  private constructor(stdout: string, stderr: string) {
    this.stdout = stdout;
    this.stderr = stderr;
  }

  public passed(): boolean {
    return !(this.stderr.length > 0);
  }

  public log(): string {
    let result: string = "";

    if (this.stdout.length > 0) {
      result += chalk.cyan("stdout: \n");
      result += chalk.white(this.stdout);
      result += "\n";
    }

    if (this.stderr.length > 0) {
      result += chalk.cyan("stderr: \n");
      result += chalk.white(this.stderr);
      result += "\n";
    }

    return result;
  }

  public static async run(fileName: string): Promise<Runner> {
    let result: Runner;

    try {
      const { stdout, stderr } = await exec(`ts-node ${fileName}`);
      result = new Runner(stdout, stderr);
    }
    catch (e) {
      result = new Runner("", (e as Error).message);
    }

    return result;
  }
};

class Tester {
  private files: string[];

  constructor(testDir: string) {
    this.files = this.getFiles(testDir);
  }

  private getFiles(dir: string): string[] {
    const lookuper = function (dir: string, files: string[] = []): string[] {
      for (let item of fs.readdirSync(dir)) {
        const name = dir + '/' + item;

        if (fs.statSync(name).isDirectory()) {
          lookuper(name, files);
        } else {
          files.push(name);
        }
      }
      return files;
    }

    let files = lookuper(dir);

    // exclude *.d.ts files
    const regex = new RegExp(".*[^.^d].ts$", 'g');

    files = files.filter((value: string): boolean => {
      const m = value.match(regex);
      return (m === null) ? false : m.length > 0;
    });

    return files;
  }

  public async test(): Promise<boolean> {
    let all_counter: number = 0;
    let passed_counter: number = 0;

    console.log(chalk.white("Running tests..."));

    const lineMaxLength = this.files.reduce(
      (previous, current) => { return previous.length > current.length ? previous : current }).length + 2;

    for (let file of this.files) {

      process.stdout.write(chalk.green(file.padEnd(lineMaxLength, ".")));

      const result = await Runner.run(file);

      all_counter++;

      if (result.passed()) {
        console.log(chalk.green("OK"));
        passed_counter++;
      } else {
        console.log(chalk.red("FAIL"));
        console.log(result.log());
      }
    }

    console.log(chalk.green("=".padStart(lineMaxLength + 5, "=")));
    console.log(chalk.white(`all   : ${all_counter}`));
    console.log(chalk.white(`passed: ${passed_counter}`));

    return passed_counter === all_counter;
  }

  public static async run(fileName: string): Promise<boolean> {
    console.log(chalk.white("Running one..."));
    const result = await Runner.run(fileName);
    console.log(result.log());
    return result.passed();
  }
};

const entry = async function () {
  if (argv.source) {
    const fileName = argv.source as string;
    const status = await Tester.run(fileName);

    if (!status) {
      process.exit(1);
    }
  }
  else {
    const tester = new Tester(testDir);
    const status = await tester.test();
    if (!status) {
      process.exit(1);
    }
  }
}

entry();
