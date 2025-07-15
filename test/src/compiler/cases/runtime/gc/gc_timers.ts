import { gcTest } from "./gc_test_fixture";

function checkSetTimeoutClearBody() {
    setTimeout(() => {
    }, 0);
}

function checkSetTimeoutLocalVar() {
    setTimeout(() => {
        const s = "aaaaaa";
    }, 0);
}

const s = "aaaaa";

function checkSetTimeoutCapture() {
    setTimeout(() => {
        const b = s;
    }, 0);
}

function checkNestedSetTimeout() {
    setTimeout(() => {
        let n = 1;
       setTimeout(() => {
           n = 2;
       }, 0);
    }, 0);
}

gcTest(checkSetTimeoutClearBody, "Timers checkSetTimeoutClearBody");
gcTest(checkSetTimeoutLocalVar, "Timers checkSetTimeoutLocalVar");
gcTest(checkSetTimeoutCapture, "Timers checkSetTimeoutCapture");
gcTest(checkNestedSetTimeout, "Timers checkNestedSetTimeout");