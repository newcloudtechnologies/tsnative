/// <reference path="dummy_base.d.ts" />

declare module "cpp" {
    import { ValueType, VTable } from "std/decorators/decorators";

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
        pureVirtualMethodToOverride(): number;

        @ValueType
        private _s: string;
    }

    @VTable
    export class DerivedFromVirtualBase extends VirtualBase {
        constructor();

        pureVirtualMethodToOverride(): number;

        private _i: number;
    }

    export class DerivedFromBaseInOtherNamespace implements Base {
        constructor();

        test(): void;
    }
}
