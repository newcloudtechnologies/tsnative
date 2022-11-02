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

#include "ParameterValue.h"

namespace parser
{

ParameterValue::ParameterValue(const clang::ParmVarDecl* decl)
    : m_decl(decl)
{
}

std::string ParameterValue::name() const
{
    return m_decl->getNameAsString();
}

clang::QualType ParameterValue::type() const
{
    return m_decl->getType();
}

bool ParameterValue::isParameterPack() const
{
    return m_decl->isParameterPack();
}

bool ParameterValue::isPointerType() const
{
    return m_decl->getType()->isAnyPointerType();
}

bool ParameterValue::isTemplated() const
{
    return m_decl->isTemplated();
}

const clang::ParmVarDecl* ParameterValue::decl() const
{
    return m_decl;
}

} //  namespace parser
