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

#include "FunctionTemplateItem.h"

#include <clang/AST/DeclTemplate.h>

namespace parser
{

FunctionTemplateItem::FunctionTemplateItem(const std::string& name,
                                           const std::string& prefix,
                                           bool isLocal,
                                           const clang::FunctionTemplateDecl* decl)
    : FunctionItem(AbstractItem::Type::FUNCTION_TEMPLATE, name, prefix, isLocal, decl->getAsFunction())
    , m_decl(decl)
{
}

std::vector<TemplateParameterValue> FunctionTemplateItem::templateParameters() const
{
    return getTemplateParameters(m_decl);
}

const clang::FunctionTemplateDecl* FunctionTemplateItem::decl() const
{
    return m_decl;
}

} //  namespace parser
