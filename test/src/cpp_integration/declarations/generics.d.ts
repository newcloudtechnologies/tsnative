export declare class ClassWithTemplateMethod {
    constructor();

    getWithAdditionOfTwo<T>(value: T): T;
}

export declare class ClassWithTemplateMembers<FirstMemberType, SecondMemberType> {
    constructor(_: FirstMemberType);

    get(): FirstMemberType;

    // intentionally out of generic parameters order
    private m_1: SecondMemberType;
    private m_2: FirstMemberType;
}

export declare class TemplateClassWithTemplateMethod<T> {
    constructor(transformBase: T);

    transform<U>(value: U): U;

    private _transformBase: T;
}

export declare function sum<T, R>(firstOperand: T, secondOperand: T): R