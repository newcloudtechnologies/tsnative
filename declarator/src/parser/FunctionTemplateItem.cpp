#include "FunctionTemplateItem.h"

#include <clang/AST/DeclTemplate.h>

namespace parser
{

FunctionTemplateItem::FunctionTemplateItem(const std::string& name,
                                           const std::string& prefix,
                                           bool isLocal,
                                           bool isCompletedDecl,
                                           const clang::FunctionTemplateDecl* decl)
    : FunctionItem(AbstractItem::Type::FUNCTION_TEMPLATE, name, prefix, isLocal, isCompletedDecl, decl->getAsFunction())
    , m_decl(decl)
{
}

std::vector<TemplateParameterValue> FunctionTemplateItem::templateParameters() const
{
    return getTemplateParameters(m_decl);
}

const clang::FunctionTemplateDecl* FunctionTemplateItem::decl() const
{
    return m_decl;
}

} //  namespace parser
