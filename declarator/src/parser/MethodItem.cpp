/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "MethodItem.h"

#include "utils/Exception.h"

#include <clang/AST/ASTContext.h>
#include <clang/AST/VTableBuilder.h>

namespace parser
{

MethodItem::MethodItem(const clang::CXXMethodDecl* decl)
    : m_decl(decl)
{
}

MethodItem::MethodItem(const clang::FunctionTemplateDecl* decl)
    : m_decl(nullptr)
{
    const auto* functionDecl = decl->getAsFunction();
    _ASSERT(functionDecl);

    m_decl = clang::dyn_cast_or_null<const clang::CXXMethodDecl>(functionDecl);
    _ASSERT(m_decl);
}

std::string MethodItem::name() const
{
    return m_decl->getNameAsString();
}

bool MethodItem::isConstructor() const
{
    return clang::dyn_cast_or_null<const clang::CXXConstructorDecl>(m_decl);
}

bool MethodItem::isDestructor() const
{
    return clang::dyn_cast_or_null<const clang::CXXDestructorDecl>(m_decl);
}

bool MethodItem::isVirtual() const
{
    return m_decl->isVirtual();
}

bool MethodItem::isPureVirtual() const
{
    return m_decl->isVirtual() && m_decl->isPure();
}

bool MethodItem::isStatic() const
{
    return m_decl->isStatic();
}

clang::QualType MethodItem::returnType() const
{
    return m_decl->getReturnType();
}

std::vector<ParameterValue> MethodItem::parameters() const
{
    std::vector<ParameterValue> result;

    for (const auto& it : m_decl->parameters())
    {
        result.push_back(it);
    }

    return result;
}

const clang::CXXMethodDecl* MethodItem::decl() const
{
    return m_decl;
}

int MethodItem::getVTableIndex() const
{
    int result = -1;

    if (!isVirtual())
    {
        return result;
    }

    auto* VTableContext = m_decl->getASTContext().getVTableContext();
    _ASSERT(VTableContext);

    if (VTableContext->isMicrosoft())
    {
        auto* microsoftVTableContext = clang::dyn_cast_or_null<clang::MicrosoftVTableContext>(VTableContext);
        _ASSERT(microsoftVTableContext);

        result = microsoftVTableContext->getMethodVFTableLocation(m_decl).Index;
    }
    else
    {
        auto* itaniumVTableContext = clang::dyn_cast_or_null<clang::ItaniumVTableContext>(VTableContext);
        _ASSERT(itaniumVTableContext);

        result = itaniumVTableContext->getMethodVTableIndex(m_decl);
    }

    return result;
}

} //  namespace parser
