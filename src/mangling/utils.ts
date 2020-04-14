import * as ts from "typescript";

export function getDeclarationBaseName(declaration: ts.NamedDeclaration) {
  switch (declaration.kind) {
    case ts.SyntaxKind.Constructor:
      return "constructor";
    case ts.SyntaxKind.IndexSignature:
      return "operator[]";
    default:
      return declaration.name!.getText();
  }
}
