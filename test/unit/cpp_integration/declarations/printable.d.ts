// @ts-nocheck

declare module "cpp" {
    export class Printable {
        constructor(point: Point, s: string, i: int32_t);

        @ValueType
        private point_: Point;
        @ValueType
        private string_: string;
        private i_: int32_t;
    }
}