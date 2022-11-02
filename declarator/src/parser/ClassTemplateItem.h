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

#include "ClassItem.h"
#include "TemplateParameterValue.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclTemplate.h>

#include <functional>
#include <memory>

namespace parser
{

class ClassTemplateItem : public std::enable_shared_from_this<ClassTemplateItem>, public ClassItem
{
    friend class AbstractItem;

    const clang::ClassTemplateDecl* m_decl;
    mutable int m_size = -1;

private:
    ClassTemplateItem(const std::string& name,
                      const std::string& prefix,
                      bool isLocal,
                      bool isCompletedDecl,
                      const clang::ClassTemplateDecl* decl);

public:
    std::vector<TemplateParameterValue> templateParameters() const;

    int size() const override;

    const clang::ClassTemplateDecl* decl() const;
};

using class_template_item_t = item_t<ClassTemplateItem>;
using const_class_template_item_t = item_t<const ClassTemplateItem>;

} //  namespace parser
