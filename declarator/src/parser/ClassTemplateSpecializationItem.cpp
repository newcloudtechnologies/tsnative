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
