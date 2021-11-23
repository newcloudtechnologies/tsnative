#!/usr/bin/env node
/*
 * Copyright (c) New Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
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

