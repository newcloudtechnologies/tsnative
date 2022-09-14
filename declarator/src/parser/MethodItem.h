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

#include "ParameterValue.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <memory>
#include <string>
#include <vector>

namespace parser
{

class MethodItem;
using method_item_t = std::shared_ptr<MethodItem>;
using const_method_item_t = std::shared_ptr<const MethodItem>;

using method_item_list_t = std::vector<method_item_t>;
using const_method_item_list_t = std::vector<const_method_item_t>;

class MethodItem
{
    const clang::CXXMethodDecl* m_decl;

protected:
    MethodItem(const clang::CXXMethodDecl* decl);
    MethodItem(const clang::FunctionTemplateDecl* decl);

public:
    virtual ~MethodItem() = default;

    std::string name() const;
    bool isConstructor() const;
    bool isDestructor() const;
    bool isVirtual() const;
    bool isPureVirtual() const;
    bool isStatic() const;
    clang::QualType returnType() const;
    std::vector<ParameterValue> parameters() const;
    const clang::CXXMethodDecl* decl() const;

    template <typename... Args>
    static method_item_t make(Args&&... args)
    {
        method_item_t result;
        result.reset(new MethodItem(std::forward<Args>(args)...));
        return result;
    }
};

} //  namespace parser
