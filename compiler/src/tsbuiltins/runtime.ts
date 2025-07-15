import { LLVMGenerator } from "../generator";
import { FunctionMangler } from "../mangling";
import { LLVMValue, LLVMGlobalVariable, LLVMConstant } from "../llvm/value";
import { Declaration } from "../ts/declaration";
import { LLVMType } from "../llvm/type";
import { GC } from "../tsbuiltins/gc";
import { EventLoop } from "../tsbuiltins/eventloop";

export class Runtime {
  private readonly generator: LLVMGenerator;

  private garbageCollector: GC;

  private getGCFn: LLVMValue;
  private globalGCAddress: LLVMValue | undefined;

  private eventLoop: EventLoop;

  private getLoopFn: LLVMValue;

  private globalEventLoopAddress: LLVMValue | undefined;

  constructor(declaration: Declaration, generator: LLVMGenerator) {
    this.generator = generator;

    this.getGCFn = this.findGetGC(declaration);

    this.garbageCollector = new GC(this.generator, this);

    this.eventLoop = new EventLoop(this.generator, this);

    this.getLoopFn = this.findGetLoop(declaration);
  }

  get gc(): GC {
    return this.garbageCollector;
  }

  getGCAddress(): LLVMValue {
    if (!this.globalGCAddress) {
      throw new Error("Cannot get GC address because global gc variable has not been created yet");
    }
    return this.generator.builder.createLoad(this.globalGCAddress);
  }

  initGlobalState() {
    this.putGCIntoGlobalVariable();
    this.putEventLoopIntoGlobalVariable();
  }

  getLoop(): EventLoop {
    return this.eventLoop;
  }

  private putGCIntoGlobalVariable() {
    const nullValue = LLVMConstant.createNullValue(this.gc.getGCType(), this.generator);
    this.globalGCAddress = LLVMGlobalVariable.make(this.generator, this.gc.getGCType(), false, nullValue, "gc_constant");

    const gcAddress = this.callGetGC();
    this.generator.builder.createSafeStore(gcAddress, this.globalGCAddress);

    this.generator.symbolTable.globalScope.set("GlobalGC", this.globalGCAddress);
  }

  private callGetGC(): LLVMValue {
    const addressVoidStar = this.generator.builder.createSafeCall(this.getGCFn, [], "global GC void*");
    return this.generator.builder.createBitCast(addressVoidStar, this.gc.getGCType(), "global GC");
  }

  private findGetGC(declaration: Declaration) {
    const getGCDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "getGC");
    if (!getGCDeclaration) {
      throw Error("Unable to find getGC function");
    }

    const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);

    const { qualifiedName } = FunctionMangler.mangle(
      getGCDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined,
      []
    );

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes: LLVMType[] = [];

    return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
  }

  private findGetLoop(declaration: Declaration) {
    const loopDeclaration = declaration.members.find((m) => m.isMethod() && m.name?.getText() === "getLoop");
    if (!loopDeclaration) {
      throw Error("Unable to find getLoop function");
    }

    const thisType = this.generator.ts.checker.getTypeAtLocation(declaration.unwrapped);

    const { qualifiedName } = FunctionMangler.mangle(
      loopDeclaration,
      undefined,
      thisType,
      [],
      this.generator,
      undefined,
      []
    );

    const llvmReturnType = LLVMType.getInt8Type(this.generator).getPointer();
    const llvmArgumentTypes: LLVMType[] = [];

    return this.generator.llvm.function.create(llvmReturnType, llvmArgumentTypes, qualifiedName).fn;
  }

  private callGetLoop(): LLVMValue {
    const addressVoidStar = this.generator.builder.createSafeCall(this.getLoopFn, [], "global Event loop void*");
    return this.generator.builder.createBitCast(addressVoidStar, this.eventLoop.getEventLoopType(), "global Event loop");
  }

  private putEventLoopIntoGlobalVariable() {
    const nullValue = LLVMConstant.createNullValue(this.eventLoop.getEventLoopType(), this.generator);
    this.globalEventLoopAddress = LLVMGlobalVariable.make(this.generator, this.eventLoop.getEventLoopType(),
      false, nullValue, "event_loop_constant");

    const eventLoopAddress = this.callGetLoop();
    this.generator.builder.createSafeStore(eventLoopAddress, this.globalEventLoopAddress);

    this.generator.symbolTable.globalScope.set("GlobalEventLoop", this.globalEventLoopAddress);
  }

  getEventLoopAddress(): LLVMValue {
    if (!this.globalEventLoopAddress) {
      throw new Error("Cannot get Event loop address because global Event loop variable has not been created yet");
    }
    return this.generator.builder.createLoad(this.globalEventLoopAddress);
  }
}