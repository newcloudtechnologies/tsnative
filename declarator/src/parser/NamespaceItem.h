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
    void setDecl(const clang::NamespaceDecl* decl);
};

using namespace_item_t = item_t<NamespaceItem>;
using const_namespace_item_t = item_t<const NamespaceItem>;

} //  namespace parser
