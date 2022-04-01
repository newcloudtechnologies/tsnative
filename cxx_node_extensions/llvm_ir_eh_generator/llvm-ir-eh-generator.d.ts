
declare namespace ir_generator {
  class ExceptionHandlingGenerator {
    constructor(module: any, builder: any);
    createUnreachable(): void;
    createInvoke(value: any, normalDestBB: any, unwindBB: any, args: any[]): void;
    setPersonalityFn(destFn: any): void;
    addLandingPad(alloca: any): any;
  }
}

export = ir_generator;
export as namespace ir_generator;
