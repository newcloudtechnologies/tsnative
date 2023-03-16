import { LLVMGenerator } from "../generator";
import { LLVMValue } from "../llvm/value";
import { Environment, ScopeValue } from "../scope";

export class VariableFinder {
    private generator: LLVMGenerator;

    constructor(gen: LLVMGenerator) {
        this.generator = gen;
    }

    find(name: string, outerEnv?: Environment): ScopeValue | undefined {
      if (outerEnv) {
        const insideEnv = this.findInsideEnv(name, outerEnv);
        if (insideEnv) {
          return insideEnv;
        }
      }
      
      return this.findInsideScopes(name);
    }

    findInsideEnv(name: string, outerEnv: Environment): LLVMValue | undefined {
      const index = outerEnv.getVariableIndex(name);
      if (index > -1) {
        const agg = this.generator.builder.createLoad(outerEnv.typed);
        return this.generator.builder.createSafeExtractValue(agg, [index]);
      }

      return undefined;
    }

    findInsideScopes(name: string) {
      return this.generator.symbolTable.currentScope.tryGetThroughParentChain(name);
    }
}