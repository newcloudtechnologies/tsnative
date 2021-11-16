#!/usr/bin/env node

const { execSync } = require('child_process');
const { argv, execPath } = require('process');
const { join, dirname } = require('path');

function getArguments() {
    const args = argv.slice(2);
    return args;
}

execSync(`node ${join(__dirname, "..", "build", "src", "main.js")} ${getArguments().map((value) => value.startsWith("--") ? value : `"${value}"`).join(" ")}`, { stdio: 'inherit' });


