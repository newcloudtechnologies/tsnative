import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.round(-0.0), -0.0), "Math: round(-0) failed");
    console.assert(equals(Math.round(0), 0), "Math: round(0) failed");
    console.assert(equals(Math.round(-0.2), 0), "Math: round(-0.2) failed");
    console.assert(equals(Math.round(-0.5), -0.0), "Math: round(-0.5) failed");
    console.assert(equals(Math.round(-0.6), -1), "Math: round(-0.6) failed");
    console.assert(equals(Math.round(0.2), 0), "Math: round(0.2) failed");
    console.assert(equals(Math.round(0.5), 1), "Math: round(0.5) failed");
    console.assert(equals(Math.round(0.7), 1), "Math: round(0.7) failed");
    console.assert(Number.isNaN(Math.round(NaN)), "Math: round(NaN) failed");
    console.assert(Math.round(+Infinity) === +Infinity, "Math: round(+Infinity) failed");
    console.assert(Math.round(-Infinity) === -Infinity, "Math: round(-Infinity) failed");
    console.assert(equals(Math.round(1 / 10.0), Math.floor(1 / 10 + 0.5)), "Math: round(0.1) === floor(0.6) failed");
    console.assert((1 / Math.round(-0.5)) === 1 / -0, "Math: round(-0.5) === 1/-0 failed");
    console.assert((1 / Math.round(-0.25)) === 1 / -0, "Math: round(-0.25) === 1/-0 failed");


    {
        const x = -(2 / EPS - 1);
        console.assert(equals(Math.round(x), x), "Math: round(-(2 / EPS - 1)) === x failed");
    }
    {
        const x = -(1.5 / EPS - 1);
        console.assert(equals(Math.round(x), x), "Math: round(-(1.5 / EPS - 1)) === x failed");
    }
    {
        const x = -(1 / EPS + 1);
        console.assert(equals(Math.round(x), x), "Math: round(-(1 / EPS + 1)) === x failed");
    }
    {
        const x = 1 / EPS + 1;
        console.assert(equals(Math.round(x), x), "Math: round(1 / EPS + 1) === x failed");
    }
}