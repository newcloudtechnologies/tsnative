#pragma once

#include "FunctionItem.h"

#include "TemplateParameterValue.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>

namespace parser
{

class FunctionTemplateItem : public FunctionItem
{
    friend class AbstractItem;

    const clang::FunctionTemplateDecl* m_decl;

private:
    FunctionTemplateItem(const std::string& name,
                         const std::string& prefix,
                         bool isLocal,
                         bool isCompletedDecl,
                         const clang::FunctionTemplateDecl* decl);

public:
    std::vector<TemplateParameterValue> templateParameters() const;

    const clang::FunctionTemplateDecl* decl() const;
};

using function_template_item_t = item_t<FunctionTemplateItem>;
using const_function_template_item_t = item_t<const FunctionTemplateItem>;

} //  namespace parser