/// <reference path="dummy_base.d.ts" />

declare module "cpp" {
    import { ValueType, VTable } from "std-typescript-llvm/decorators/decorators";
    import { int32_t } from "std-typescript-llvm/definitions/lib.std.numeric";

    import { Base } from "test";

    export interface PointPair {
        getTopLeft(): Point;
        getBottomRight(): Point;
    }

    export interface RectHolder {
        getRect(): Rect;
    }

    export class Mixin implements PointPair, RectHolder {
        constructor(x1: number, y1: number, x2: number, y2: number);

        getTopLeft(): Point;
        getBottomRight(): Point;

        getRect(): Rect;

        getScaled(factor: number): this;

        @ValueType
        private topLeft: Point;
        @ValueType
        private bottomRight: Point;

        @ValueType
        private rect: Rect;
    }

    @VTable
    export class VirtualBase {
        constructor();

        virtualMethod(): string;
        pureVirtualMethodToOverride(): int32_t;

        @ValueType
        private _s: string;
    }

    @VTable
    export class DerivedFromVirtualBase extends VirtualBase {
        constructor();

        pureVirtualMethodToOverride(): int32_t;

        private _i: int32_t;
    }

    export class DerivedFromBaseInOtherNamespace implements Base {
        constructor();

        test(): void;
    }
}
