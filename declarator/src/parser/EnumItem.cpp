#include "EnumItem.h"

namespace parser
{

EnumItem::Enumerator::Enumerator(const clang::EnumConstantDecl* decl)
    : m_decl(decl)
{
}

std::string EnumItem::Enumerator::name() const
{
    return m_decl->getNameAsString();
}

std::string EnumItem::Enumerator::value() const
{
    std::string result;
    llvm::raw_string_ostream oss(result);
    m_decl->getInitVal().print(oss, false);
    oss.flush();
    return result;
}

EnumItem::EnumItem(
    const std::string& name, const std::string& prefix, bool isLocal, bool isCompletedDecl, const clang::EnumDecl* decl)
    : AbstractItem(AbstractItem::Type::ENUM, name, prefix, isLocal, isCompletedDecl)
    , m_decl(decl)
{
}

std::vector<EnumItem::Enumerator> EnumItem::enumerators() const
{
    std::vector<Enumerator> result;

    for (const auto& it : m_decl->enumerators())
    {
        result.push_back(it);
    }

    return result;
}

const clang::EnumDecl* EnumItem::decl() const
{
    return m_decl;
}

} //  namespace parser
