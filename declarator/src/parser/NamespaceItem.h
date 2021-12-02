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

#pragma once

#include "ContainerItem.h"

#include <clang/AST/Decl.h>

namespace parser
{

class NamespaceItem : public ContainerItem
{
    friend class AbstractItem;

    const clang::NamespaceDecl* m_decl;

private:
    NamespaceItem(const std::string& name, const std::string& prefix, bool isLocal, const clang::NamespaceDecl* decl);

public:
    const clang::NamespaceDecl* decl() const;
};

using namespace_item_t = item_t<NamespaceItem>;
using const_namespace_item_t = item_t<const NamespaceItem>;

} //  namespace parser
