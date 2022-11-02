/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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
