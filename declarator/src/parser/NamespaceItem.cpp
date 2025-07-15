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
