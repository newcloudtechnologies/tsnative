// @ts-nocheck

export declare class Point {
    constructor(x: number, y: number);

    get x(): number;
    get y(): number;

    private _x: number;
    private _y: number;
}

export declare class Button {
    constructor();

    onClicked(handler: TSClosure): void;
    onClickedWithPoint(handler: TSClosure): void;

    click(): void;
    clickWithPoint(point: Point): void;

    private onClickedHandler: number;
    private onClickedWithPointHandler: number;
}