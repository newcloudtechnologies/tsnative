//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Event {
    private p0_Event: number;
    private p1_Event: number;
    private p2_Event: number;

    entity(): void;
    event(): void;
}

//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class CustomEvent extends Event {
    private p0_CustomEvent: number;
    private p1_CustomEvent: number;
    private p2_CustomEvent: number;

    abc(): void;
    a(): void;
    ak(): void;
    al(): void;
    am(): void;
    b(): void;
    bk(): void;
    c(): void;
    ck(): void;
    cl(): void;
    de(): void;
    d(): void;
    e(): void;
    customEvent(): void;
}
