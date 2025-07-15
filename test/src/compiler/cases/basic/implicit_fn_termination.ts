// Only test buildability here.

const terminatedDefaultClause = function () {
    const i: number = 1;
    switch (i) {
        case 0:
            return 0;
        default:
            return 2
    }
}

const implicitlyTerminated = function () {
    if (false) {
        // @ts-ignore (skip unreachable code check)
        return 1;
    }
}