/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

// Nothing to test here, all the tests should be placed on C++ side
// Test buildabily, non-crashing. Use it as a reference.

import { Override } from "std/decorators/decorators"
import { Component, AnotherWidget, Handler } from "./declarations/component"

const i = 2;

class SomeScopeWidget extends Component {
    n = 444;

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