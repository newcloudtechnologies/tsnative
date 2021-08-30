#!/usr/bin/env node

const { execSync } = require('child_process');
const { argv, execPath } = require('process');
const { join, dirname } = require('path');

function getArguments() {
    const args = argv.slice(2);
    return args;
}

function isCompilerCall() {
    const args = getArguments();
    return args.includes("--processTemplateClasses") || args.includes("--processTemplateFunctions") || args.includes("--output");
}

if (isCompilerCall()) {
    execSync(`node ${join(__dirname, "..", "build", "main.js")} ${getArguments().map((value) => value.startsWith("--") ? value : `"${value}"`).join(" ")}`, { stdio: 'inherit' });
} else {
    // Entry point.
    // Overwrite PKG_EXECPATH environment variable, see: https://github.com/vercel/pkg/issues/376
    if (process.platform === "win32") {
        execSync(`set "PKG_EXECPATH=" & sh ${join(dirname(execPath), "..", "builder", "start.sh")} ${getArguments().join(" ")}`, { stdio: 'inherit' });
    } else {
        execSync(`PKG_EXECPATH=; ${join(dirname(execPath), "..", "builder", "start.sh")} ${getArguments().join(" ")}`, { stdio: 'inherit' });
    }
}