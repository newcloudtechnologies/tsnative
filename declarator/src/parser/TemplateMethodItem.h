#pragma once

#include "MethodItem.h"
#include "TemplateParameterValue.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <vector>

namespace parser
{

class TemplateMethodItem;
using template_method_item_t = std::shared_ptr<TemplateMethodItem>;
using const_template_method_item_t = std::shared_ptr<const TemplateMethodItem>;

using template_method_item_list_t = std::vector<template_method_item_t>;
using const_template_method_item_list_t = std::vector<const_template_method_item_t>;

class TemplateMethodItem : public MethodItem
{
private:
    const clang::FunctionTemplateDecl* m_decl;

protected:
    TemplateMethodItem(const clang::FunctionTemplateDecl* decl);

public:
    std::vector<TemplateParameterValue> templateParameters() const;

    const clang::FunctionTemplateDecl* decl() const;

    // TODO: use make<>() from MethodItem
    template <typename... Args>
    static template_method_item_t make(Args&&... args)
    {
        template_method_item_t result;
        result.reset(new TemplateMethodItem(std::forward<Args>(args)...));
        return result;
    }
};

} //  namespace parser
