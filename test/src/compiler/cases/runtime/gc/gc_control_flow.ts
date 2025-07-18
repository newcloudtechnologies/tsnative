import { gcTest } from "./gc_test_fixture";

function checkIfs() {
    if (true) {
        let v = 10;
        v = 15;
    }

    let arr = [1, 2, 3, 4, 5]
    for (let a of arr) {
        if (a % 2 === 0) {
            a += 10;
        }
        else if (a % 3 === 0) {
            a += 25;
        }
        else {
            a += 15;
        }
    }

    let s = "abcaba";
    if (arr[0] === 1 && arr[1] === 2) {
        if (arr[2] === 3) {
            if (arr[3] === 4) {
                s = "my str";
            }
            else {
                s = "not my str";
            }
        }
    }
}

function checkSwitch() {
    let day: string = "Sunday";
    let result = "";

    switch (day) {
      case "Sunday":
        result = "Sunday";
        break;
      case "Monday":
        result = "Monday";
        break;
      default:
        result = "default";
        break;
      case "Tuesday":
        result = "Tuesday";
        break;
      case "Wednesday":
        result = "Wednesday";
        break;
      case "Thursday":
        result = "Thursday";
        break;
      case "Friday":
        result = "Friday";
        break;
      case "Saturday":
        result = "Saturday";
        break;
    }

    console.assert(result === "Sunday", "GC switch: check result is alive");
}

function checkTernary() {
    const t1 = true ? "a" : "b";
    const t2 = (1 + 2) ? "a" : "b";
    const t3 = true ? (true ? "a" : "c") : "b";

    function foo(): number|string {
        return 10;
    }

    const t4 = true ? foo() : "b";

    const t5 = {
        text: true ? foo() : "b"
    }

    t5.text = "abacaba";
}

function checkForOf() {
    {
        const arr = [1, 2, 3];
        for (let value of arr) {
            value += 1;
        }
    }

    {
        const arr = [1, 2, 3];

        for (const value of arr) {
            if (value === 2) {
                break;
            }
        }
    }

    {
        const set = new Set<number>();
        set.add(3).add(1).add(-22);

        for (const value of set) {
            let a = value - 10;
        }
    }

    {
        const map = new Map<number, string>();
        map.set(10, "Z").set(1, "A").set(2, "B");

        for (const [key, value] of map) {
            const kk = key + 100;
            const vv = value + "ZZZ";
        }
    }

    // TODO TSN-388
    // {
    //     const arr = [1, 2, 3];
    //     for (const value of arr) {
    //         if (value === 2) {
    //             continue;
    //         }

    //         let a = 150;
    //         a = -1;
    //     }
    // }

    {
        const arr = [1, 2, 3];
        let counter = 0;

        for (const value of arr) {
            if (value === 2) {
                break;
            }

            ++counter;
        }
    }
}

function checkFor() {
    const COUNT = 10;
    for (let i = 0; i < COUNT; ++i) { 
        let a = 10;
        a = 15;
    }

    // with initializer, internal condition and incrementor
    for (let i = 0; ; ++i) {
        if (i === COUNT) {
            break;
        }
    }

    // pseudo `forever` construction
    for (; ;) {
        if (true)
            break;
    }

    for (let i = 0; i < COUNT; ++i) {
        if (true) {
            continue;
        }
    }
}

function checkWhile() {
    let i = 0;

    while (i < 2) {
        ++i;
    }

    i = 0;
    while (i < 2) {
        ++i;
        if (i === 1) {
            continue;
        }
    }

    i = 0;
    while (i < 2) {
        ++i;
        if (i === 1) {
            continue;
        }
    }

    i = 0;
    while (i < 2) {
        ++i;
        if (i === 1) {
            break;
        }
    }

    // TODO TSN-388
    // const arr = [1, 2]

    // let counter = 0;

    // while (true) {
    //     const flagB = true;

    //     for (const _ of arr) {
    //         ++counter;
    //     }

    //     ++counter;

    //     if (flagB) {
    //         break;
    //     }
    // }
}

function checkForIn() {
    {
        const s: String = "abacaba";
        for (const i in s) {
        }
    }

    // String iteration + continue
    {
        const s: String = "abcdefgh";
        let continueCounter = 0;
        let iterationsCounter = 0;
        for (const i in s) {
            ++iterationsCounter;
            if (continueCounter > 2) {
                continue;
            }
            ++continueCounter;
        }
    }

    {
        const s: String = "abcdefgh";
        let counter = 0;
        for (const i in s) {
            if (counter > 2) {
                break;
            }
            ++counter;
        }
    }

    {
        const obj = { name: 10, 5: 0 };
        let continueCounter = 0;
        let iterationsCounter = 0;
        for (const i in obj) {
            ++iterationsCounter;
            if (continueCounter > 0) {
                continue;
            }
            ++continueCounter;
        }
    }

    {
        const obj = { name: 10, 5: 0, id: "asdasda" };
        let counter = 0;
        for (const i in obj) {
            if (counter === 1) {
                break;
            }
            ++counter;
        }
    }

    {
        const innerObject = { "innerKey": 1 };
        const obj = { innerObject: "outerValue" };
        let counter = 0;
        for (const k in obj) {
            ++counter;
        }
    }

    {
        class Base {
            x: number = 0;
            y: string = "";
        };

        class Derived extends Base {
            x: number = 10; // Shadowing
            z: number = 100;
        };

        const d = new Derived();
        let counter = 0;
        for (const k in d) {
            ++counter;
        }
    }

    {
        const arr = [1, 2, 3];

        for (const value in arr) {
        }
    }

    {
        const arr = [1, 2, 3];
        let counter = 0;

        for (const value in arr) {
            if (counter === 0) {
                continue;
            }

            ++counter;
        }
    }

    {
        const arr = [1, 2, 3];
        for (const value in arr) {
            if (value === "0") {
                break;
            }
        }
    }
}

function checkDoWhile() {
    {
        let i = 0;
        do {
            ++i;
        }
        while (i < 2);
    }

    {
        let i = 0;
        do {
            if (i === 1) {
                i += 4;
                continue;
            }
            ++i;
        } while (i < 2);
    }

    {
        let i = 0;
        do {
            if (i === 1) {
                break;
            }
            ++i;
        } while (i < 2);
    }
}

gcTest(checkIfs, "Check if construction");
gcTest(checkSwitch, "Check switch construction");
gcTest(checkTernary, "Check ternary construction");
gcTest(checkForOf, "Check for of construction");
gcTest(checkFor, "Check for construction");
gcTest(checkWhile, "Check while construction");
gcTest(checkForIn, "Check forIn construction");
gcTest(checkDoWhile, "Check do while construction");