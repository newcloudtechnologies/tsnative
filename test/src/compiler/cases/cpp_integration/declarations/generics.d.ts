export declare class ClassWithTemplateMethod {
    constructor();

    getWithAdditionOfTwo<T>(value: T): T;

    private p0: number;
    private p1: number;
    private p2: number;
}

export declare class ClassWithTemplateMembers<FirstMemberType, SecondMemberType> {
    constructor(_: FirstMemberType);

    getFirst(): FirstMemberType;

    private p0: number;
    private p1: number;
    private p2: number;
}

export declare class TemplateClassWithTemplateMethod<T> {
    constructor(transformBase: T);

    transform<U>(value: U): U;

    private p0: number;
    private p1: number;
    private p2: number;
}

export declare function sum<T, R>(firstOperand: T, secondOperand: T): R