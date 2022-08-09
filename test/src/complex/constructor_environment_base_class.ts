import { T } from "./constructor_environment_other_class";

export namespace S {
    export enum RxMargins_e {
        Top = (1 << 0),
        Bottom = (1 << 3),
    }
}

export class Base {
    margins(m: S.RxMargins_e) {
        if (m & S.RxMargins_e.Top) {
            console.assert(true, "Expected Base.margins argument to be S.RxMargins_e.Top (1)");
        } else {
            console.assert(false, "Expected Base.margins argument to be S.RxMargins_e.Top (2)");
        }

        new T();
    }
}
