#!/usr/bin/env node
/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

const { execSync } = require('child_process');
const { argv, execPath } = require('process');
const { join, dirname } = require('path');

function getArguments() {
    const args = argv.slice(2);
    return args;
}

execSync(`node ${join(__dirname, "..", "node_modules", "typescript", "lib", "tsc.js")} ${getArguments().map((value) => value.startsWith("--") ? value : `"${value}"`).join(" ")}`, { stdio: 'inherit' });

