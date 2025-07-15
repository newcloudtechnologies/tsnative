#pragma once

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <string>
#include <vector>

namespace parser
{

class TemplateParameterValue
{
    const clang::TemplateTypeParmDecl* m_decl;

public:
    TemplateParameterValue(const clang::TemplateTypeParmDecl* decl);

    std::string name() const;
    bool isParameterPack() const;
    bool isPointerType() const;
    const clang::TemplateTypeParmDecl* decl() const;
};

std::vector<TemplateParameterValue> getTemplateParameters(const clang::TemplateDecl* templateDecl);

} //  namespace parser
