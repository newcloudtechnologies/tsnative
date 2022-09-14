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
