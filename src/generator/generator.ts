import { LLVMEmitter } from "@emitter";
import { addInterfaceScope, Scope, SymbolTable } from "@scope";
import { createLLVMFunction, error, isValueType } from "@utils";
import * as llvm from "llvm-node";
import * as ts from "typescript";

export class LLVMGenerator {
  readonly checker: ts.TypeChecker;
  readonly module: llvm.Module;
  readonly context: llvm.LLVMContext;
  readonly builder: llvm.IRBuilder;
  readonly emitter: LLVMEmitter;
  readonly symbolTable: SymbolTable;
  readonly program: ts.Program;

  constructor(program: ts.Program) {
    this.program = program;
    this.checker = program.getTypeChecker();
    this.context = new llvm.LLVMContext();
    this.module = new llvm.Module("main", this.context);
    this.builder = new llvm.IRBuilder(this.context);
    this.emitter = new LLVMEmitter();
    this.symbolTable = new SymbolTable();
  }

  emitProgram(): llvm.Module {
    const mainReturnType = llvm.Type.getInt32Ty(this.context);
    const main = createLLVMFunction(mainReturnType, [], "main", this.module);
    const entryBlock = llvm.BasicBlock.create(this.context, "entry", main);

    this.builder.setInsertionPoint(entryBlock);
    // @todo keep original file ordering
    for (const sourceFile of this.program.getSourceFiles()) {
      this.emitSourceFile(sourceFile);
    }

    this.builder.createRet(llvm.Constant.getNullValue(mainReturnType));

    try {
      llvm.verifyModule(this.module);
    } catch (error) {
      error.message += "\n" + this.module.print();
      throw error;
    }

    return this.module;
  }

  emitSourceFile(sourceFile: ts.SourceFile) {
    this.symbolTable.pushScope(sourceFile.fileName);
    sourceFile.forEachChild(node => this.emitNode(node, this.symbolTable.currentScope));
  }

  emitNode(node: ts.Node, parentScope: Scope): void {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.IndexSignature:
      case ts.SyntaxKind.Constructor:
        // Declarations have no actual arguments. Emit them when called.
        break;
      case ts.SyntaxKind.InterfaceDeclaration:
        addInterfaceScope(node as ts.InterfaceDeclaration, parentScope, this);
        break;
      case ts.SyntaxKind.ClassDeclaration:
        this.emitter.class.emitClassDeclaration(node as ts.ClassDeclaration, [], parentScope, this);
        break;
      case ts.SyntaxKind.ModuleDeclaration:
        this.emitter.module.emitModuleDeclaration(node as ts.ModuleDeclaration, parentScope, this);
        break;
      case ts.SyntaxKind.Block:
        this.emitter.block.emitBlock(node as ts.Block, this);
        break;
      case ts.SyntaxKind.ExpressionStatement:
        this.emitter.expressionStatement.emitExpressionStatement(node as ts.ExpressionStatement, this);
        break;
      case ts.SyntaxKind.IfStatement:
        this.emitter.branch.emitIfStatement(node as ts.IfStatement, parentScope, this);
        break;
      case ts.SyntaxKind.WhileStatement:
        this.emitter.loop.emitWhileStatement(node as ts.WhileStatement, this);
        break;
      case ts.SyntaxKind.ForStatement:
        this.emitter.loop.emitForStatement(node as ts.ForStatement, this);
        break;
      case ts.SyntaxKind.ContinueStatement:
        this.emitter.loop.emitContinueStatement(node as ts.ContinueStatement, this);
        break;
      case ts.SyntaxKind.BreakStatement:
        this.emitter.loop.emitBreakStatement(node as ts.BreakStatement, this);
        break;
      case ts.SyntaxKind.ReturnStatement:
        this.emitter.return.emitReturnStatement(node as ts.ReturnStatement, this);
        break;
      case ts.SyntaxKind.VariableStatement:
        this.emitter.variable.emitVariableStatement(node as ts.VariableStatement, parentScope, this);
        break;
      case ts.SyntaxKind.VariableDeclarationList:
        this.emitter.variable.emitVariableDeclarationList(node as ts.VariableDeclarationList, parentScope, this);
        break;
      case ts.SyntaxKind.EndOfFileToken:
        break;
      case ts.SyntaxKind.EnumDeclaration:
        break;
      case ts.SyntaxKind.ImportDeclaration:
        break;
      case ts.SyntaxKind.ExportAssignment:
        break;
      default:
        error(`Unhandled ts.Node '${ts.SyntaxKind[node.kind]}': ${node.getText()}`);
    }
  }

  emitValueExpression(expression: ts.Expression): llvm.Value {
    switch (expression.kind) {
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.emitter.unary.emitPrefixUnaryExpression(expression as ts.PrefixUnaryExpression, this);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.emitter.unary.emitPostfixUnaryExpression(expression as ts.PostfixUnaryExpression, this);
      case ts.SyntaxKind.BinaryExpression:
        return this.emitter.binary.emit(expression as ts.BinaryExpression, this);
      case ts.SyntaxKind.CallExpression:
        return this.emitter.func.emitCallExpression(expression as ts.CallExpression, this);
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.emitter.access.emitPropertyAccessExpression(expression as ts.PropertyAccessExpression, this);
      case ts.SyntaxKind.ElementAccessExpression:
        return this.emitter.access.emitElementAccessExpression(expression as ts.ElementAccessExpression, this);
      case ts.SyntaxKind.Identifier:
        return this.emitter.identifier.emitIdentifier(expression as ts.Identifier, this);
      case ts.SyntaxKind.ThisKeyword:
        return this.emitter.identifier.emitThis(this);
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return this.emitter.literal.emitBooleanLiteral(expression as ts.BooleanLiteral, this);
      case ts.SyntaxKind.NumericLiteral:
        return this.emitter.literal.emitNumericLiteral(expression as ts.NumericLiteral, this);
      case ts.SyntaxKind.StringLiteral:
        return this.emitter.literal.emitStringLiteral(expression as ts.StringLiteral, this);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.emitter.literal.emitArrayLiteralExpression(expression as ts.ArrayLiteralExpression, this);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.emitter.literal.emitObjectLiteralExpression(expression as ts.ObjectLiteralExpression, this);
      case ts.SyntaxKind.NewExpression:
        return this.emitter.func.emitNewExpression(expression as ts.NewExpression, this);
      case ts.SyntaxKind.ParenthesizedExpression:
        return this.emitValueExpression((expression as ts.ParenthesizedExpression).expression);
      default:
        return error(`Unhandled ts.Expression '${ts.SyntaxKind[expression.kind]}'`);
    }
  }

  emitExpression(expression: ts.Expression): llvm.Value {
    return this.createLoadIfNecessary(this.emitValueExpression(expression));
  }

  createLoadIfNecessary(value: llvm.Value) {
    if (value.type.isPointerTy() && isValueType(value.type.elementType)) {
      return this.builder.createLoad(value, value.name + ".load");
    }
    return value;
  }

  get currentFunction(): llvm.Function {
    const insertBlock = this.builder.getInsertBlock();
    if (!insertBlock) {
      return error("Cannot get current LLVM function: no insert block");
    }
    return insertBlock.parent!;
  }
}
