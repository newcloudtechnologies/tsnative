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

#include "MethodItem.h"
#include "TemplateParameterValue.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <vector>

namespace parser
{

class TemplateMethodItem : public MethodItem
{
private:
    const clang::FunctionTemplateDecl* m_decl;

public:
    TemplateMethodItem(const clang::FunctionTemplateDecl* decl);

    std::vector<TemplateParameterValue> templateParameters() const;

    const clang::FunctionTemplateDecl* decl() const;
};

} //  namespace parser
