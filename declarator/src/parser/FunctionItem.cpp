#include "FunctionItem.h"

namespace parser
{

FunctionItem::FunctionItem(const std::string& name,
                           const std::string& prefix,
                           bool isLocal,
                           bool isCompletedDecl,
                           const clang::FunctionDecl* decl)
    : AbstractItem(AbstractItem::Type::FUNCTION, name, prefix, isLocal, isCompletedDecl)
    , m_decl(decl)
{
}

FunctionItem::FunctionItem(Type type,
                           const std::string& name,
                           const std::string& prefix,
                           bool isLocal,
                           bool isCompletedDecl,
                           const clang::FunctionDecl* decl)
    : AbstractItem(type, name, prefix, isLocal, isCompletedDecl)
    , m_decl(decl)
{
}

bool FunctionItem::isStatic() const
{
    return m_decl->isStatic();
}

clang::QualType FunctionItem::returnType() const
{
    return m_decl->getReturnType();
}

std::vector<ParameterValue> FunctionItem::parameters() const
{
    std::vector<ParameterValue> result;

    for (const auto& it : m_decl->parameters())
    {
        result.push_back(it);
    }

    return result;
}

const clang::FunctionDecl* FunctionItem::decl() const
{
    return m_decl;
}

} //  namespace parser
