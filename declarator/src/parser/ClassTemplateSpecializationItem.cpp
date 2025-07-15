#include "ClassTemplateSpecializationItem.h"

namespace parser
{

ClassTemplateSpecializationItem::ClassTemplateSpecializationItem(const std::string& name,
                                                                 const std::string& prefix,
                                                                 bool isLocal,
                                                                 bool isCompletedDecl,
                                                                 const clang::ClassTemplateSpecializationDecl* decl)
    : ClassItem(AbstractItem::Type::CLASS_TEMPLATE_SPECIALIZATION, name, prefix, isLocal, isCompletedDecl, decl)
    , m_decl(decl)
{
}

const clang::ClassTemplateSpecializationDecl* ClassTemplateSpecializationItem::decl() const
{
    return m_decl;
}

} //  namespace parser
