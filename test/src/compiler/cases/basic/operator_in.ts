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

{
    let a = { c: 10, b: 20 };                                                                                   
    console.assert("c" in a === true, "In operator: Positive in properties");
    console.assert("d" in a === false, "In operator: Negative in properties");
}

{
    // Test for nested
    const c = {
        x: 1,
        y: {
            z: 9
        }
    }
    console.assert("x" in c === true, "In operator: Nested properties 1");
    console.assert("y" in c === true, "In operator: Nested properties 2");
    console.assert("z" in c === false, "In operator: Nested properties 3");
}

{
    let a = { "c": 10, "b": 20, "foo": function(){}}
    console.assert("c" in a === true, "In operator: function in properties 1");
    console.assert("b" in a === true, "In operator: function in properties 2");
    console.assert("foo" in a === true, "In operator: function in properties 3");
}

// FIXME: uncomment this once TSN-244 is fixed
// {
//     class A {
//         x = 10;
//         sqX() : number{
//             return this.x * this.x;
//         }
//     }
//     console.assert("x" in A === false, "In operator: class 1");
//     console.assert("sqX" in A === false, "In operator: class 2");
//     console.assert("z" in A === false, "In operator: class 3");
// }

{
    class A {
        x = 10;
        sqX() : number {
            return this.x * this.x;
        }
    }
    const a = new A();

    console.assert("x" in a === true, "In operator: class instance 1");
    console.assert("sqX" in a === true, "In operator: class instance 1");
    console.assert("z" in a === false, "In operator: class instance 1");
}

{
    class C {
        _length = 0;
        get length() {
          return this._length;
        }
        set length(value) {
          this._length = value;
        }
    }
    const c = new C();

    // TODO This test to be uncommented after TSN-218
    // console.assert("length" in c === true, "In operator: class with property getter and setter 1")
    console.assert("_length" in c === true, "In operator: class with property getter and setter 2")
}

{
    class C {
        _length = 0;
        get length() {
          return this._length;
        }
        set length(value) {
          this._length = value;
        }
    }
    class D extends C {
        x = 1;
    }
    const d = new D();

    // TODO This test to be uncommented after TSN-218
    //console.assert("length" in d === true, "In operator: class with property getter and setter and inheritance 1")
    console.assert("_length" in d === true, "In operator: class with property getter and setter and inheritance 2")
    console.assert("x" in d === true, "In operator: class with property getter and setter and inheritance 3")
}


{
    class Base {
        m = 10;
    }
    class Derived extends Base {
        n = 15;
    }
    const d = new Derived();
    console.assert("m" in d === true, "In operator: inheritance 1");
    console.assert("n" in d === true, "In operator: inheritance 2");
}

{
    class Base {
        m = 10;
    }
    class Derived extends Base {
        n = 15;
    }

    class Derived2 extends Derived {
        k = 15;
    }

    const d = new Derived2();
    console.assert("m" in d === true, "In operator: deep inheritance 1");
    console.assert("n" in d === true, "In operator: deep inheritance 2");
    console.assert("n" in d === true, "In operator: deep inheritance 3");
}

{
    class Employee {
        static headcount: number = 0;
        constructor(private name: string) {
            Employee.headcount++;
        }
        static getHeadcount() : number {
            return Employee.headcount;
        }
    }
    const a = new Employee("Foo");
    // TODO: uncomment this after TNS-247 is fixed
    //console.assert("name" in a === true, "In operator: static 1");
    console.assert("headcount" in a === false, "In operator: static 2");
    console.assert("getHeadcount" in a === false, "In operator: static 3");
}

// TODO this doesn't work, see TSN-247
// {
//     // FIXME: this syntax is unsupported
//     //var trees = new Array<String>("redwood", "bay", "cedar", "oak", "maple");
//     var trees = new Array<String>();
//     trees.push("redwood");
//     trees.push("bay");
//     trees.push("cedar");
//     trees.push("oak");
//     trees.push("maple");

//     console.assert(0 in trees === true, "In operator: array 1");
//     console.assert(3 in trees === true, "In operator: array 2");
//     console.assert(6 in trees === false, "In operator: array 3");
//     console.assert("bay" in trees === false, "In operator: array 4");
// }

// TODO this doesn't work, see TSN-247
// {
//     let a = [1, 2, 15];
//     console.assert(0 in a === true, "In operator: array2 1");
//     console.assert(1 in a === true, "In operator: array2 2");
//     console.assert(2 in a === true, "In operator: array2 3");
//     console.assert(3 in a === false, "In operator: array2 4");
// }

// TODO this doesn't work, see TSN-247
// {
//     let s = new String("ab")
//     console.assert('a' in s === false, "In operator: string 1");
//     console.assert(0 in s === true, "In operator: string 2");
//     console.assert(1 in s === true, "In operator: string 2");
//     console.assert(2 in s === false, "In operator: string 2");
// }

// TODO this doesn't work
// {
//     console.assert("toString" in {} === true, "In operator: default inheritance 1");
// }

{
    class A {
        constructor() {};

        get foo() { return 10; }
        set bar(a: number) {};

        static baz() {};

        barbar() {};
    }
    let aa = new A();

    // TODO: commented out methods don't work but expected to work
    //console.assert("constructor" in aa === true, "In operator: class with methods 1");
    //console.assert("foo" in aa === true, "In operator: class with methods 2");
    //console.assert("bar" in aa === true, "In operator: class with methods 3");
    console.assert("baz" in aa === false, "In operator: class with methods 4");
    //console.assert("toString" in aa === true, "In operator: class with methods 5");
    console.assert("barbar" in aa === true, "In operator: class with methods 6");

    //console.assert("constructor" in new Array<String>() === true, "In operator: class with methods 7");
    //console.assert("push" in new Array<String>() === true, "In operator: class with methods 8");
}

{
    type Person = {
        name: string;
        age: number;
    }
    let a : Person = {name: "foo", age: 10};
    console.assert("name" in a === true, "In operator: type 1");
    console.assert("age" in a === true, "In operator: type 2");
}

{
    type Person = {
        name: string;
        age?: number;
    }
    let a : Person = {name: "foo", age: 10};
    console.assert("name" in a === true, "In operator: type wiht optional 1");
    console.assert("age" in a === true, "In operator: type wiht optional 2");

    let b : Person = {name: "foo"};
    console.assert("name" in b === true, "In operator: type wiht optional 3");
    console.assert("age" in b === false, "In operator: type wiht optional 4");
    
    let c : Person = {name: "foo", age: undefined};
    console.assert("name" in c === true, "In operator: type wiht optional 5");
    console.assert("age" in c === true, "In operator: type wiht optional 6");
}

{
    class Example {
        id?: number;
    }

    const a = new Example();  
    console.assert("id" in a === false, "In operator: class wiht optional 2");

    const b : Example = {id : 10};
    console.assert("id" in b === true, "In operator: class wiht optional 3");

    const c : Example = {id : undefined};
    console.assert("id" in c === true, "In operator: class wiht optional 4");
}

{
    interface SquareConfig {
        color?: string;
        width?: number;
    }
    let a : SquareConfig = {color: "foo", width : 3};
    console.assert("color" in a === true, "In operator: interface wiht optional 1");
    console.assert("width" in a === true, "In operator: interface wiht optional 2");

    let b : SquareConfig = {color: "foo"};
    console.assert("color" in b === true, "In operator: interface wiht optional 3");
    console.assert("width" in b === false, "In operator: interface wiht optional 4");

    let c : SquareConfig = {color: "foo", width : undefined};
    console.assert("color" in c === true, "In operator: interface wiht optional 5");
    console.assert("width" in c === true, "In operator: interface wiht optional 6");
}