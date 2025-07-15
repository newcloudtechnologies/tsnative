#pragma once

#include "AbstractItem.h"

#include <clang/AST/Decl.h>

#include <string>
#include <vector>

namespace parser
{

class EnumItem : public AbstractItem
{
    friend class AbstractItem;

public:
    class Enumerator
    {
        const clang::EnumConstantDecl* m_decl;

    public:
        Enumerator(const clang::EnumConstantDecl* decl);

        std::string name() const;
        std::string value() const;
    };

private:
    const clang::EnumDecl* m_decl;

private:
    EnumItem(const std::string& name,
             const std::string& prefix,
             bool isLocal,
             bool isCompletedDecl,
             const clang::EnumDecl* decl);

public:
    std::vector<Enumerator> enumerators() const;

    const clang::EnumDecl* decl() const;
};

using enum_item_t = item_t<EnumItem>;
using const_enum_item_t = item_t<const EnumItem>;

} //  namespace parser
