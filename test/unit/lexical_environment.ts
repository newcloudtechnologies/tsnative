{
    function f(a: number) {
        return function() {
            return a;
        }
    }
    const ff = f(2);
    console.assert(ff() === 2, "Argument capture failed");
}

{
    function ff() {
        let a = 22;
        return function() {
            return a;
        }
    }
    const fff = ff();
    console.assert(fff() === 22, "Local variable capture failed");
}

{
    function fff(_: number, fn: () => number) {
        return function() {
            return fn();
        }
    }
    let ffff = function() {
        return 42;
    }
    const f = fff(111, ffff);
    console.assert(f() === 42, "Funarg capture failed");
}

{
    let i = 22;
    function ffff() {
        i = 42;
    }
    ffff();
    console.assert(i === 42, "Free variable capture failed");
}

{
    let a = 0;
    function f() {
        return function() {
            return a;
        }
    }

    const g = f();
    let i = g();
    console.assert(i === a, "Free variable capture by nested function failed")
}
/* @todo
{
    function f(fn: () => number) {
        return function() {
            return fn();
        }
    }
    let a = 42;
    let g = function() {
        return a;
    }
    const h = f(g);
    h();
}
*/