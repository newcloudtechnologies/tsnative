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

#include "FunctionItem.h"

#include "TemplateParameterValue.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>

namespace parser
{

class FunctionTemplateItem : public FunctionItem
{
    friend class AbstractItem;

    const clang::FunctionTemplateDecl* m_decl;

private:
    FunctionTemplateItem(const std::string& name,
                         const std::string& prefix,
                         bool isLocal,
                         bool isCompletedDecl,
                         const clang::FunctionTemplateDecl* decl);

public:
    std::vector<TemplateParameterValue> templateParameters() const;

    const clang::FunctionTemplateDecl* decl() const;
};

using function_template_item_t = item_t<FunctionTemplateItem>;
using const_function_template_item_t = item_t<const FunctionTemplateItem>;

} //  namespace parser