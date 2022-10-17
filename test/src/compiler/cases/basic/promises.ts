import {Promise} from "tsnative/std/definitions/tspromise"

type ExecutorCallback = (val: Object) => void;

const p = new Promise((resolve: ExecutorCallback, reject: ExecutorCallback): void => {
    resolve(23);
});

// const onfuldilled1 = (s: number) => {
//     console.assert(s === 23);
//     return 1;
// };
//
// const onRejected1 = (s: number) => {
//     return 2;
// }
//
// p.then(onfuldilled1, onRejected1);

