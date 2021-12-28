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

#include "utils/Exception.h"

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

std::vector<TemplateParameterValue> getTemplateParameters(const clang::TemplateDecl* templateDecl)
{
    std::vector<TemplateParameterValue> result;

    for (const auto& it : templateDecl->getTemplateParameters()->asArray())
    {
        if (it->getKind() == clang::Decl::Kind::TemplateTypeParm)
        {
            const auto* templateParamDecl = clang::dyn_cast_or_null<const clang::TemplateTypeParmDecl>(it);
            _ASSERT(templateParamDecl);

            result.push_back(templateParamDecl);
        }
        else
        {
            // TODO: support Kind::NonTypeTemplateParm, Kind::TemplateTemplateParm and so on
            throw utils::Exception(R"(non type template parameters are not supported: "%s")",
                                   templateDecl->getNameAsString().c_str());
        }
    }

    return result;
}

} //  namespace parser
