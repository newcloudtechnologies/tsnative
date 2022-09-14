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

#include <clang/AST/Decl.h>
#include <clang/AST/DeclTemplate.h>

#include <functional>
#include <memory>

namespace parser
{

class ClassTemplateSpecializationItem : public ClassItem
{
    friend class AbstractItem;

    const clang::ClassTemplateSpecializationDecl* m_decl;

private:
    ClassTemplateSpecializationItem(const std::string& name,
                                    const std::string& prefix,
                                    bool isLocal,
                                    bool isCompletedDecl,
                                    const clang::ClassTemplateSpecializationDecl* decl);

public:
    const clang::ClassTemplateSpecializationDecl* decl() const;
};

using class_template_specialization_item_t = item_t<ClassTemplateSpecializationItem>;
using const_class_template_specialization_item_t = item_t<const ClassTemplateSpecializationItem>;

} //  namespace parser
