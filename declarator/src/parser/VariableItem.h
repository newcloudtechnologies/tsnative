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

#pragma once

#include "AbstractItem.h"

#include <clang/AST/Decl.h>

namespace parser
{

class VariableItem : public AbstractItem
{
    friend class AbstractItem;

    const clang::VarDecl* m_decl;

private:
    VariableItem(const std::string& name,
                 const std::string& prefix,
                 bool isLocal,
                 bool isCompletedDecl,
                 const clang::VarDecl* decl);

public:
    ~VariableItem() = default;

    clang::QualType type() const;
    int size() const;

    const clang::VarDecl* decl() const;
};

using variable_item_t = item_t<VariableItem>;
using const_variable_item_t = item_t<const VariableItem>;

using variable_item_list_t = std::vector<variable_item_t>;
using const_variable_item_list_t = std::vector<const_variable_item_t>;

} //  namespace parser