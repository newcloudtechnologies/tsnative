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

#include "ContainerItem.h"
#include "FieldItem.h"
#include "MethodItem.h"
#include "TemplateMethodItem.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <string>
#include <vector>

namespace parser
{

class ClassItem : public ContainerItem
{
    friend class AbstractItem;

private:
    const clang::CXXRecordDecl* m_decl;

private:
    ClassItem(const std::string& name,
              const std::string& prefix,
              bool isLocal,
              bool isCompletedDecl,
              const clang::CXXRecordDecl* decl);

protected:
    ClassItem(Type type,
              const std::string& name,
              const std::string& prefix,
              bool isLocal,
              bool isCompletedDecl,
              const clang::CXXRecordDecl* decl);

    void visit(std::function<void(const clang::Decl* decl)> handler) const;

public:
    virtual ~ClassItem() = default;
    virtual int size() const;

    method_item_list_t methods() const;
    template_method_item_list_t templateMethods() const;
    field_item_list_t fields() const;
    std::vector<clang::CXXBaseSpecifier> bases() const;
    bool hasVirtualDestructor() const;
    bool hasVTable() const;
    int getVTableSize() const;
    const clang::CXXRecordDecl* decl() const;
};

using class_item_t = item_t<ClassItem>;
using const_class_item_t = item_t<const ClassItem>;

} //  namespace parser
