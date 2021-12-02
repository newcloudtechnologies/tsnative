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

#include "ClassItem.h"
#include "TemplateMethodItem.h"
#include "TemplateParameterValue.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclTemplate.h>

#include <functional>

namespace parser
{

class ClassTemplateItem : public ClassItem
{
    friend class AbstractItem;

    const clang::ClassTemplateDecl* m_decl;

private:
    ClassTemplateItem(const std::string& name,
                      const std::string& prefix,
                      bool isLocal,
                      const clang::ClassTemplateDecl* decl);

    void visit(std::function<void(const clang::Decl* decl)> handler) const;

public:
    std::vector<TemplateMethodItem> templateMethods() const;
    std::vector<TemplateParameterValue> templateParameters() const;

    const clang::ClassTemplateDecl* decl() const;
};

using class_template_item_t = item_t<ClassTemplateItem>;
using const_class_template_item_t = item_t<const ClassTemplateItem>;

} //  namespace parser
