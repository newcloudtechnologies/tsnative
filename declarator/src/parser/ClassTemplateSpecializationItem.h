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
