import { VTable, VTableSize, VirtualDestructor, Virtual } from "std/decorators/decorators";

export declare class AnotherWidget {
    constructor();
}

@VTable
@VirtualDestructor
// @ts-ignore
@VTableSize(6)
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
}

export declare class Handler {
    constructor();

    handle(c: Component): void;
}
