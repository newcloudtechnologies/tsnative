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

bool TemplateParameterValue::isPointerType() const
{
    bool result = false;

    if (m_decl->getKind() == clang::Decl::Kind::TemplateTypeParm)
    {
        result = m_decl->getTypeForDecl()->isAnyPointerType();
    }

    return result;
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
