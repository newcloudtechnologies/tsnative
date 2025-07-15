#pragma once

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>

#include <string>

namespace parser
{

class ParameterValue
{
    const clang::ParmVarDecl* m_decl;

public:
    ParameterValue(const clang::ParmVarDecl* decl);

    std::string name() const;
    clang::QualType type() const;
    bool isParameterPack() const;
    bool isPointerType() const;
    bool isTemplated() const;
    const clang::ParmVarDecl* decl() const;
};

} //  namespace parser
