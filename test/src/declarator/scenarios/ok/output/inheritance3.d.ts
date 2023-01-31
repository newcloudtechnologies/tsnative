//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Event {
    entity(): void;
    event(): void;
}

//@ts-ignore
@Size(4)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class CustomEvent extends Event {
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