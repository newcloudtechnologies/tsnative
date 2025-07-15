#include "TemplateMethodItem.h"

#include "utils/Exception.h"

namespace parser
{

TemplateMethodItem::TemplateMethodItem(const clang::FunctionTemplateDecl* decl)
    : MethodItem(decl)
    , m_decl(decl)
{
}

std::vector<TemplateParameterValue> TemplateMethodItem::templateParameters() const
{
    std::vector<TemplateParameterValue> result;

    for (const auto& it : m_decl->getTemplateParameters()->asArray())
    {
        _ASSERT(it->getKind() == clang::Decl::Kind::TemplateTypeParm);

        const auto* templateParamDecl = clang::dyn_cast_or_null<const clang::TemplateTypeParmDecl>(it);
        _ASSERT(templateParamDecl);

        result.push_back(templateParamDecl);
    }

    return result;
}

const clang::FunctionTemplateDecl* TemplateMethodItem::decl() const
{
    return m_decl;
}

} //  namespace parser
