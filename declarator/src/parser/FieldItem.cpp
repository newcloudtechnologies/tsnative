/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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
