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

#include "ClassTemplateItem.h"

#include "utils/Exception.h"

namespace parser
{

ClassTemplateItem::ClassTemplateItem(const std::string& name,
                                     const std::string& prefix,
                                     bool isLocal,
                                     const clang::ClassTemplateDecl* decl)
    : ClassItem(name, prefix, isLocal, decl)
    , m_decl(decl)
{
}

void ClassTemplateItem::visit(std::function<void(const clang::Decl* decl)> handler) const
{
    auto* recordDecl = static_cast<const ClassItem*>(this)->decl();

    for (const auto& it : recordDecl->decls())
    {
        handler(it);
    }
}

std::vector<TemplateMethodItem> ClassTemplateItem::templateMethods() const
{
    std::vector<TemplateMethodItem> result;

    visit(
        [&result](const clang::Decl* decl)
        {
            if (decl->getKind() == clang::Decl::Kind::FunctionTemplate)
            {
                const auto* functionTemplateDecl = clang::dyn_cast_or_null<const clang::FunctionTemplateDecl>(decl);
                _ASSERT(functionTemplateDecl);

                result.push_back(functionTemplateDecl);
            }
        });

    return result;
}

std::vector<TemplateParameterValue> ClassTemplateItem::templateParameters() const
{
    std::vector<TemplateParameterValue> result;

    for (const auto& it : m_decl->getTemplateParameters()->asArray())
    {
        // ignore clang::Decl::Kind::NonTypeTemplateParm
        if (it->getKind() == clang::Decl::Kind::TemplateTypeParm)
        {
            const auto* templateParamDecl = clang::dyn_cast_or_null<const clang::TemplateTypeParmDecl>(it);
            _ASSERT(templateParamDecl);

            result.push_back(templateParamDecl);
        }
    }

    return result;
}

const clang::ClassTemplateDecl* ClassTemplateItem::decl() const
{
    return m_decl;
}

} //  namespace parser