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

#include "ClassItem.h"
#include "utils/Exception.h"

#include <clang/AST/ASTContext.h>
#include <clang/AST/CharUnits.h>
#include <clang/AST/VTableBuilder.h>

namespace parser
{

ClassItem::ClassItem(const std::string& name,
                     const std::string& prefix,
                     bool isLocal,
                     bool isCompletedDecl,
                     const clang::CXXRecordDecl* decl)
    : ContainerItem(AbstractItem::Type::CLASS, name, prefix, isLocal, isCompletedDecl)
    , m_decl(decl)
{
    _ASSERT(m_decl);
}

ClassItem::ClassItem(Type type,
                     const std::string& name,
                     const std::string& prefix,
                     bool isLocal,
                     bool isCompletedDecl,
                     const clang::CXXRecordDecl* decl)
    : ContainerItem(type, name, prefix, isLocal, isCompletedDecl)
    , m_decl(decl)
{
    _ASSERT(m_decl);
}

void ClassItem::visit(std::function<void(const clang::Decl* decl)> handler) const
{
    for (const auto& it : m_decl->decls())
    {
        handler(it);
    }
}

int ClassItem::size() const
{
    int result = -1;

    if (m_decl->hasDefinition())
    {
        const auto* type = m_decl->getTypeForDecl();
        auto info = m_decl->getASTContext().getTypeInfo(type);

        result = info.Width / sizeof(info.Width);
    }

    return result;
}

method_item_list_t ClassItem::methods() const
{
    method_item_list_t result;

    if (m_decl && m_decl->hasDefinition())
    {
        for (const auto& it : m_decl->methods())
        {
            result.push_back(MethodItem::make(it));
        }
    }

    return result;
}

template_method_item_list_t ClassItem::templateMethods() const
{
    template_method_item_list_t result;

    visit(
        [&result](const clang::Decl* decl)
        {
            if (decl->getKind() == clang::Decl::Kind::FunctionTemplate)
            {
                const auto* functionTemplateDecl = clang::dyn_cast_or_null<const clang::FunctionTemplateDecl>(decl);
                _ASSERT(functionTemplateDecl);

                result.push_back(TemplateMethodItem::make(functionTemplateDecl));
            }
        });

    return result;
}

field_item_list_t ClassItem::fields() const
{
    field_item_list_t result;

    if (m_decl && m_decl->hasDefinition())
    {
        for (const auto& it : m_decl->fields())
        {
            result.push_back(FieldItem::make(it));
        }
    }

    return result;
}

std::vector<clang::CXXBaseSpecifier> ClassItem::bases() const
{
    std::vector<clang::CXXBaseSpecifier> result;

    if (m_decl && m_decl->hasDefinition())
    {
        for (const auto& it : m_decl->bases())
        {
            result.push_back(it);
        }
    }

    return result;
}

bool ClassItem::hasVirtualDestructor() const
{
    bool result = false;

    for (const auto& it : methods())
    {
        if (it->isDestructor() && it->isVirtual())
        {
            result = true;
            break;
        }
    }

    return result;
}

bool ClassItem::hasVTable() const
{
    bool result = false;

    for (const auto& it : methods())
    {
        if (it->isVirtual())
        {
            result = true;
            break;
        }
    }

    return result;
}

int ClassItem::getVTableSize() const
{
    int result = 0;

    auto* VTableContext = m_decl->getASTContext().getVTableContext();
    _ASSERT(VTableContext);

    if (VTableContext->isMicrosoft())
    {
        auto* microsoftVTableContext = clang::dyn_cast_or_null<clang::MicrosoftVTableContext>(VTableContext);
        _ASSERT(microsoftVTableContext);

        const clang::VTableLayout& vtLayout = microsoftVTableContext->getVFTableLayout(m_decl, clang::CharUnits::One());
        result = vtLayout.vtable_components().size();
    }
    else
    {
        auto* itaniumVTableContext = clang::dyn_cast_or_null<clang::ItaniumVTableContext>(VTableContext);
        _ASSERT(itaniumVTableContext);

        const clang::VTableLayout& vtLayout = itaniumVTableContext->getVTableLayout(m_decl);
        result = vtLayout.vtable_components().size();
    }

    return result;
}

const clang::CXXRecordDecl* ClassItem::decl() const
{
    return m_decl;
}

} //  namespace parser