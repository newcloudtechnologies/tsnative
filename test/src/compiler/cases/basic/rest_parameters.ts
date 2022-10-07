{
    function sumFD(addend: number, ...theArgs: number[]) {
        return theArgs.map((value) => {
            return value + addend;
        });
    }

    const summed = sumFD(1, 2, 3);
    console.assert(summed[0] === 3, "Function declaration sum failed (1)");
    console.assert(summed[1] === 4, "Function declaration sum failed (2)");
}

{
    const sumFE = function (addend: number, ...theArgs: number[]) {
        return theArgs.map((value) => {
            return value + addend;
        });
    }

    const summed = sumFE(2, 2, 3);
    console.assert(summed[0] === 4, "Function expression sum failed (1)");
    console.assert(summed[1] === 5, "Function expression sum failed (2)");
}

{
    const sumArrow = (addend: number, ...theArgs: number[]) => {
        return theArgs.map((value) => {
            return value + addend;
        });
    }

    const summed = sumArrow(3, 2, 3);
    console.assert(summed[0] === 5, "Arrow function sum failed (1)");
    console.assert(summed[1] === 6, "Arrow function sum failed (2)");
}

{
    const dummy = (...theArgs: number[]) => {
        return theArgs;
    }

    const empty = dummy();
    console.assert(empty.length === 0, "Rest parameters function without arguments provided test failed");
}

{
    const dummyWithNonRestParameters = (_: string, ...theArgs: number[]) => {
        return theArgs;
    }

    const empty = dummyWithNonRestParameters("test ya");
    console.assert(empty.length === 0, "Function with non-rest parameters without arguments provided test failed");
}

{
    class TheWidget { }

    class TheContainer_t {
        constructor(_: string, expectedLength: number, ...children: TheWidget[]) {
            console.assert(children.length === expectedLength, "Constructor rest parameters");
        }
    }

    new TheContainer_t("How much is the fish:", 0);
    new TheContainer_t("How much is the fish:", 3,
        new TheWidget,
        new TheWidget,
        new TheWidget,
    )
}
