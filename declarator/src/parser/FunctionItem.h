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
#include "ParameterValue.h"

#include <clang/AST/Decl.h>

namespace parser
{

class FunctionItem : public AbstractItem
{
    friend class AbstractItem;

    const clang::FunctionDecl* m_decl;

private:
    FunctionItem(const std::string& name, const std::string& prefix, bool isLocal, const clang::FunctionDecl* decl);

protected:
    FunctionItem(
        Type type, const std::string& name, const std::string& prefix, bool isLocal, const clang::FunctionDecl* decl);

public:
    virtual ~FunctionItem() = default;

    std::string name() const;
    bool isStatic() const;
    clang::QualType returnType() const;
    std::vector<ParameterValue> parameters() const;
    const clang::FunctionDecl* decl() const;
};

using function_item_t = item_t<FunctionItem>;
using const_function_item_t = item_t<const FunctionItem>;

} //  namespace parser