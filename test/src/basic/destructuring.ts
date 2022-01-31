// Array/Tuple
{
    const foo = ['one', 'two', 'three'];

    const [red, yellow, green] = foo;
    console.assert(red === "one", "Basic variable assignment (1)");
    console.assert(yellow === "two", "Basic variable assignment (2)");
    console.assert(green === "three", "Basic variable assignment (3)");

    {
        let a: number = 0;
        let b: number = 0;
        {
            [a, b] = [1, 2];
        }
        console.assert(a === 1, "Assignment separate from declaration (1)");
        console.assert(b === 2, "Assignment separate from declaration (2)");
    }

    {
        let a = 1;
        let b = 3;

        [a, b] = [b, a];

        console.assert(a === 3, "Swapping variables (1)");
        console.assert(b === 1, "Swapping variables (2)");
    }

    /* 
        
    @todo
    
    const arr = [1,2,3];
    [arr[2], arr[1]] = [arr[1], arr[2]];
    console.log(arr); // [1,3,2]
     
    function f_() {
        return [1, 2];
    }
    
    let a: number, b: number;
    [a, b] = f_();
    console.log(a); // 1
    console.log(b); // 2
    */
}