// Nothing to test here, all the tests should be placed on C++ side
// Test buildabily, non-crashing. Use it as a reference.

import { Override } from "tsnative/std/decorators/decorators"
import { Component, AnotherWidget, Handler } from "cpp_integration_exts"

const i = 2;

class SomeScopeWidget extends Component {
    n: number;

    constructor() { super(); this.n = 444; }

    @Override()
    render() {
        console.log(i)
        console.log("SomeScopeWidget overrides Component.render");
        return new AnotherWidget();
    }

    @Override()
    draw() {
        console.log(this.n, this.m)
        console.log("SomeScopeWidget overrides Component.draw");
    }
}

class AnotherSomeScopeWidget extends Component {
    @Override()
    draw() {
        console.log("AnotherSomeScopeWidget overrides Component.draw");
    }
}

const ssw1 = new SomeScopeWidget();
const ssw2 = new AnotherSomeScopeWidget();

const h = new Handler();
h.handle(ssw1);
h.handle(ssw2);

ssw1.test();
ssw2.test();
