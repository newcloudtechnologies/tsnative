#!/usr/bin/env node

const { execSync } = require('child_process');
const { argv } = require('process');
const { join } = require('path');

function getArguments() {
    const args = argv.slice(2);
    return args;
}

let executable = join(__dirname, "pkg", "compiler");
if (process.platform === "win32") {
	executable += ".exe";
}

execSync(`${executable} ${getArguments().join(' ')}`, { stdio: 'inherit' });
