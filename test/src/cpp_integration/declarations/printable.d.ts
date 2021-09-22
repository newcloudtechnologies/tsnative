declare module "cpp" {
    import { ValueType } from "std/decorators/decorators";
    import { int64_t } from "std/definitions/lib.std.numeric";

    export class Printable {
        constructor(point: Point, s: string, i: int64_t);

        @ValueType
        private point_: Point;
        @ValueType
        private string_: string;
        private i_: int64_t;
    }
}