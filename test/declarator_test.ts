/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { exit } from "process";

const fs = require('fs');
const os = require('os');
const path = require('path');
const env = require('process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const chalk = require('chalk');

const current_dir = path.resolve(__dirname);
const expect_ok_snippets_dir = path.join(current_dir, "src", "declarator", "snippets", "ok");
const expect_fail_snippets_dir = path.join(current_dir, "src", "declarator", "snippets", "fail");
const output_dir = path.join(current_dir, "out", "declarator", "declarations");

const platform = os.platform();
console.log(`Platform detected: ${platform}`);

const declarator_bin = process.env.DECLARATOR_BIN as string;
const compiler_abi = process.env.COMPILER_ABI as string;
const declarator_include_dirs = process.env.DECLARATOR_INCLUDE_DIRS!.split(";") as string[];
const declarator_no_import_std = process.env.DECLARATOR_NO_IMPORT_STD as string;

if (compiler_abi == undefined || compiler_abi == "") {
    console.error("Compiler ABI cannot be empty. Please provide one with COMPILER_ABI env variable");
    exit(1);
}

console.log(`Compiler ABI: ${compiler_abi}`);

function errorHandler(e: Error) {
    console.log(chalk.red(e.message));
    process.exit(1);
}

class Logable {
    private text: string;

    public constructor(text: string) {
        this.text = text;
    }

    public passed(): boolean {
        return this.text.length === 0;
    }

    public log(): string {
        return this.text;
    }
};

class Process extends Logable {
    public constructor(name: string, stdout: string, stderr: string) {
        let log: string = "";

        if (stdout !== "" || stderr !== "") {
            log += name;
            log += ":";
            log += "\n";
        }

        if (stdout !== "") {
            log += chalk.cyan("stdout: \n");
            log += chalk.white(stdout);
            log += "\n";
        }

        if (stderr !== "") {
            log += chalk.cyan("stderr: \n");
            log += chalk.white(stderr);
            log += "\n";
        }

        super(log);
    }
};

class Declarator extends Process {
    private headerFilePath: string;

    private constructor(stdout: string, stderr: string, headerFilePath: string) {
        super("Declarator", stdout, stderr);
        this.headerFilePath = headerFilePath;
    }

    public declaration(): string {
        let result: string = "";

        let fileName = this.headerFilePath.substring(this.headerFilePath.lastIndexOf('/') + 1);
        fileName = fileName.substring(0, fileName.lastIndexOf('.')) + ".d.ts";
        result = path.join(output_dir, `/${fileName}`);

        if (!fs.existsSync(result)) {
            console.error(`output declaration ${result} doesn't exist`);
            process.exit(1);
        }

        return result;
    }

    public static async run(headerFilePath: string, compiler_abi: string): Promise<Declarator> {
        let declarator: Declarator;

        let include_list: string[] = [];

        const DECLARATOR_INCLUDE_DIRS = process.env.DECLARATOR_INCLUDE_DIRS;

        for (let item of DECLARATOR_INCLUDE_DIRS!.split(";")) {
            include_list.push(item)
        }

        include_list.concat(declarator_include_dirs);

        include_list.forEach(function (_, index, array) {
            array[index] = "-I " + array[index];
        });

        const includes = include_list.join(" ");

        try {
            if (!fs.existsSync(output_dir)) {
                fs.mkdirSync(output_dir, { recursive: true });
            }

            let { stdout, stderr } = await exec(`${declarator_bin} -nobuiltininc -x c++ --target=${compiler_abi} -D TS ${headerFilePath} ${includes}`,
                { env: { 'DECLARATOR_OUTPUT_DIR': output_dir , 'DECLARATOR_NO_IMPORT_STD': declarator_no_import_std} });

            declarator = new Declarator(stdout, stderr, headerFilePath);
        }
        catch (e) {
            declarator = new Declarator("", e as string, headerFilePath);
        }

        return declarator;
    }
};

class Diff extends Process {
    private constructor(stdout: string, stderr: string) {
        super("Diff", stdout, stderr);
    }

    public static async run(filePathOrigin: string, filePath: string): Promise<Diff | null> {
        let diff: Diff | null = null;

        // "\" -> "/"
        if (os.platform() === "win32") {
            filePathOrigin = filePathOrigin.split(path.sep).join(path.posix.sep);
            filePath = filePath.split(path.sep).join(path.posix.sep);
        }

        try {
            // when files are not identical, diff returns non zero code
            let command = "";

            if (os.platform() === "darwin") {
                command = `bash -c 'diff -B -b ${filePathOrigin} ${filePath}; exit 0'`;
            }
            else {
                command = `bash -c 'diff -Z ${filePathOrigin} ${filePath}; exit 0'`;
            }

            const { stdout, stderr } = await exec(command);

            diff = new Diff(stdout, stderr);
        }
        catch (e) {
            errorHandler(e);
        }

        return diff;
    }
};

class Snippet {
    public header: string;
    public declaration: string;

    public constructor(header: string, declaration: string) {
        this.header = header;
        this.declaration = declaration;
    }
};

class Solver extends Logable {
    private constructor(log: string = "") {
        super(log);
    }

    public static async run(snippet: Snippet): Promise<Logable> {
        let result: Logable;

        const declarator = await Declarator.run(snippet.header, compiler_abi);

        if (declarator.passed()) {
            const declaration = declarator.declaration();

            const diff = await Diff.run(snippet.declaration, declaration);

            if (diff!.passed()) {
                result = new Logable("");
            } else {
                result = new Logable(diff!.log());
            }

        } else {
            result = new Logable(declarator.log());
        }

        return result;
    }
};

class Tester {
    private expect_ok_snippets: Snippet[];
    private expect_fail_snippets: Snippet[];

    constructor(expect_ok_snippets: string, expect_fail_snippets: string) {
        this.expect_ok_snippets = this.getSnippets(expect_ok_snippets);
        this.expect_fail_snippets = this.getSnippets(expect_fail_snippets, false);
    }

    private getSnippets(dir: string, check_exist_declaration: Boolean = true): Snippet[] {
        let snippets: Snippet[] = [];

        const headers_dir = path.join(dir, "/headers");
        const declarations_dir = path.join(dir, "/declarations");

        for (let item of fs.readdirSync(headers_dir)) {
            const header_fn = headers_dir + '/' + item;

            // only *.h files
            const regex = new RegExp(".*.h$", 'g');

            if (!fs.statSync(header_fn).isDirectory() && header_fn.match(regex) !== null) {

                if (check_exist_declaration) {
                    let declaration_fn = header_fn.substring(header_fn.lastIndexOf('/') + 1);
                    declaration_fn = declaration_fn.substring(0, declaration_fn.lastIndexOf('.')) + ".d.ts";
                    declaration_fn = path.join(declarations_dir, `/${declaration_fn}`);

                    if (!fs.existsSync(declaration_fn)) {
                        errorHandler(new Error(`snippet declaration ${declaration_fn} doesn't exist`));
                    }

                    snippets.push(new Snippet(header_fn, declaration_fn));
                } else {
                    // doesn't need declaration because declarator should fail
                    snippets.push(new Snippet(header_fn, ""));
                }
            }
        }

        return snippets;
    }

    private async test_one(snippet: Snippet, ok_or_fail_expected: boolean) {
        let result = false;
        const solver = await Solver.run(snippet);

        if (ok_or_fail_expected) {
            result = solver.passed();
        } else {
            result = !solver.passed();
        }

        return Promise.resolve({ result, solver });
    }

    public async test(): Promise<void> {
        let all_counter: number = 0;
        let passed_counter: number = 0;

        console.log(chalk.white("Running tests..."));

        const lineMaxLength = this.expect_ok_snippets.reduce(
            (previous, current) => { return previous.header.length > current.header.length ? previous : current }).header.length + 2;

        // expected Ok
        for (let snippet of this.expect_ok_snippets) {
            process.stdout.write(chalk.green(snippet.header.padEnd(lineMaxLength, ".")));

            all_counter++;

            const { result, solver } = await this.test_one(snippet, true);

            if (result) {
                console.log(chalk.green("OK"));
                passed_counter++;
            } else {
                console.log(chalk.red("FAIL"));
                console.log(solver.log());
            }
        }

        // expected Fail
        for (let snippet of this.expect_fail_snippets) {
            process.stdout.write(chalk.green(snippet.header.padEnd(lineMaxLength, ".")));

            all_counter++;

            const { result, solver } = await this.test_one(snippet, false);

            if (result) {
                console.log(chalk.green("OK"));
                passed_counter++;
            } else {
                console.log(chalk.red("FAIL"));
                console.log(solver.log());
            }
        }

        console.log(chalk.green("=".padStart(lineMaxLength + 5, "=")));
        console.log(chalk.white(`all   : ${all_counter}`));
        console.log(chalk.white(`passed: ${passed_counter}`));

        if (passed_counter < all_counter) {
            process.exit(1);
        }
    }
};

const entry = async function () {
    const tester = new Tester(expect_ok_snippets_dir, expect_fail_snippets_dir);
    await tester.test();
}

entry();
