const is_equal = function <T>(a: T[], b: T[]): boolean {
    let result = false;

    if (a.length === b.length) {
        result = true;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                result = false;
                break;
            }
        }
    } else {
        result = false;
    }

    return result;
};

{
    function ForEach(model: Array<string>, callback: (element: string, index?: number) => string): Array<string> {
        return model.map(callback);
    }

    let b: string[] = ['a', 'b', 'c', 'd'];
    let a: string[] = ForEach(b, (item: string, index?: number) => {
        console.log(index);
        return item;
    })

    console.assert(is_equal(a, b), "Array.map with optional index");
}

{
    function ForEach(model: Array<string>, callback: (element: string, index?: number) => string): Array<string> {
        return model.map(callback);
    }

    let b: string[] = ['a', 'b', 'c', 'd'];
    let a: string[] = ForEach(b, (item: string) => {
        return item;
    });

    console.assert(is_equal(a, b), "Array.map with optional index (ignore value)");
}

{
    class Base {
        lol?: string = "666";
    }

    let a: Base = new Base();
    console.log("BASE:", a.lol);
    console.log("BASE:", a.lol ? a.lol : "nope");
}

{
    function myFunc(arg?: number) {
        return arg;
    }

    console.assert(myFunc(1) === 1, "Present optional argument should be returned as is");
    console.assert(myFunc() === undefined, "Absence of optional argument should return 'undefined'");
}
