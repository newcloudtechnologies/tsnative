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

#include "TemplateMethodItem.h"

namespace parser
{

TemplateParameterValue::TemplateParameterValue(const clang::TemplateTypeParmDecl* decl)
    : m_decl(decl)
{
}

std::string TemplateParameterValue::name() const
{
    return m_decl->getNameAsString();
}

bool TemplateParameterValue::isParameterPack() const
{
    return m_decl->isParameterPack();
}

const clang::TemplateTypeParmDecl* TemplateParameterValue::decl() const
{
    return m_decl;
}

} //  namespace parser
