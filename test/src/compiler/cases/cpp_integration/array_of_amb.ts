import { exts, Point } from "cpp_integration_exts";

const empty0: exts.FileInfo_t[] = [];
const empty1 = new Array<exts.FileInfo_t>();

const empty2: exts.FileInfo_t[] = <exts.FileInfo_t[]>[];
const empty3: exts.FileInfo_t[] = [] as exts.FileInfo_t[];

// variable type notation is optional:
const empty4 = <exts.FileInfo_t[]>[];
const empty5 = [] as exts.FileInfo_t[];

// array of arrays also supported:
const empty6: exts.FileInfo_t[][] = [];
const empty7 = [] as exts.FileInfo_t[][];

console.assert(!empty0.length, "Empty array initializer (0)");
console.assert(!empty1.length, "Empty array initializer (1)");
console.assert(!empty2.length, "Empty array initializer (2)");
console.assert(!empty3.length, "Empty array initializer (3)");
console.assert(!empty4.length, "Empty array initializer (4)");
console.assert(!empty5.length, "Empty array initializer (5)");
console.assert(!empty6.length, "Empty array initializer (6)");
console.assert(!empty7.length, "Empty array initializer (7)");


export function doIterate<TParam>(model: Array<TParam>) {
    let len = model.length;
    let doubledArr = new Array<TParam>();

    for (let i = len - 1; i >= 0; i--) {
        let item = model[i];
        doubledArr.push(item);
    }

    console.assert(doubledArr.length === model.length, "Iterate through array using a template function");
}

let arr: Point[] = [];
arr.push(new Point(1, 1));
arr.push(new Point(20, 10));
arr.push(new Point(300, -1));

doIterate(arr);


class MyType{
    private n: number;

    constructor()
    {
        this.n = 125;
    }
}

let arr2: MyType[] = [];
arr2.push(new MyType());
arr2.push(new MyType());

doIterate(arr2);