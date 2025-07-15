#include "VariableItem.h"

#include <clang/AST/ASTContext.h>

namespace parser
{

VariableItem::VariableItem(
    const std::string& name, const std::string& prefix, bool isLocal, bool isCompletedDecl, const clang::VarDecl* decl)
    : AbstractItem(AbstractItem::Type::VARIABLE, name, prefix, isLocal, isCompletedDecl)
    , m_decl(decl)
{
}

clang::QualType VariableItem::type() const
{
    return m_decl->getType();
}

int VariableItem::size() const
{
    return m_decl->getASTContext().getTypeSize(m_decl->getType()) / 8;
}

const clang::VarDecl* VariableItem::decl() const
{
    return m_decl;
}

} //  namespace parser
