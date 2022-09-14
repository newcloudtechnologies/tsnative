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

#include "NamespaceItem.h"

namespace parser
{

NamespaceItem::NamespaceItem(const std::string& name,
                             const std::string& prefix,
                             bool isLocal,
                             const clang::NamespaceDecl* decl)
    : ContainerItem(AbstractItem::NAMESPACE, name, prefix, isLocal, true) // Namespace always has completed decl
    , m_decl(decl)
{
}

const clang::NamespaceDecl* NamespaceItem::decl() const
{
    return m_decl;
}

void NamespaceItem::setDecl(const clang::NamespaceDecl* decl)
{
    m_decl = decl;
}

} //  namespace parser
