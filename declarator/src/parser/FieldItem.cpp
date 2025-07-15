#include "FieldItem.h"

#include "utils/Exception.h"

namespace parser
{

FieldItem::FieldItem(const clang::FieldDecl* decl)
    : m_decl(decl)
{
}

std::string FieldItem::name() const
{
    return m_decl->getNameAsString();
}

clang::QualType FieldItem::type() const
{
    return m_decl->getType();
}

const clang::FieldDecl* FieldItem::decl() const
{
    return m_decl;
}

} //  namespace parser
