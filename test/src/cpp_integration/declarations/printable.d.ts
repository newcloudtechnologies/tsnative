declare module "cpp" {
    import { ValueType } from "std/decorators/decorators";

    export class Printable {
        constructor(point: Point, s: string);

        @ValueType
        private point_: Point;
        @ValueType
        private string_: string;
    }
}