class C {
    constructor() {}
    
    static get staticGetter(): C {
        return new C;
    }

    static staticMethod() {}
}

C.staticGetter;
C.staticMethod();
