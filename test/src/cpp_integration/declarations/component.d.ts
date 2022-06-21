import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators";

export declare class AnotherWidget {
    constructor();

    private p0: number;
    private p1: number;
}

@VTable
@VirtualDestructor
// @ts-ignore
@VTableSize(9)
export declare class Component {
    constructor();

    // @ts-ignore
    @Virtual
    draw(): void;

    // @ts-ignore
    @Virtual
    render(): void;

    test(): void;

    m: number;

    private p0: number;
    private p1: number;
}

export declare class Handler {
    constructor();

    handle(c: Component): void;

    private p0: number;
    private p1: number;
}
