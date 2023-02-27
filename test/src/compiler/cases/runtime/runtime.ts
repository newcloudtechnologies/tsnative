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
import { Runtime } from "tsnative/std/definitions/runtime"

{
    const args = Runtime.getCmdArgs();
    console.assert(args.length === 1, "Runtime tests failed: Wrong arguments count");
    
    const firstArg = args[0];
    const splittedPath = firstArg.split("/");
    console.assert(splittedPath.length > 0, "Runtime tests failed: Path is empty");
    const filename = splittedPath[splittedPath.length - 1];

    const expected = "runtime";
    console.assert(filename === expected, "Runtime tests failed: First cmd arg should be binary name");
}