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

#pragma once

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <memory>
#include <string>
#include <vector>

namespace parser
{

class FieldItem;
using field_item_t = std::shared_ptr<FieldItem>;
using const_field_item_t = std::shared_ptr<const FieldItem>;

using field_item_list_t = std::vector<field_item_t>;
using const_field_item_list_t = std::vector<const_field_item_t>;

class FieldItem
{
    const clang::FieldDecl* m_decl;

private:
    FieldItem(const clang::FieldDecl* decl);

public:
    std::string name() const;
    clang::QualType type() const;

    const clang::FieldDecl* decl() const;

    template <typename... Args>
    static field_item_t make(Args&&... args)
    {
        field_item_t result;
        result.reset(new FieldItem(std::forward<Args>(args)...));
        return result;
    }
};

} //  namespace parser
