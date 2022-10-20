import {Promise} from "tsnative/std/definitions/tspromise"

Promise.resolve(true).then((b: boolean) => {
    console.assert(b);
});


