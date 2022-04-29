declare module "cpp" {
    export enum E {
        Auto = 0,
        Manual
    }

    export class EnumArgs {
        constructor(e: E);

        test(e: E): E;

        private p0: number;
        private p1: number;
        private p2: number;
    }
}
