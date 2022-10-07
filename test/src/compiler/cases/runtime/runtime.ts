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