import {Promise} from "tsnative/std/definitions/tspromise"

Promise.resolve(true).then((b: boolean): number => {
    console.assert(b);
    throw 23;
}).catch((b: number): number => {
    return b;
});


