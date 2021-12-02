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

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <string>

namespace parser
{

class TemplateParameterValue
{
    const clang::TemplateTypeParmDecl* m_decl;

public:
    TemplateParameterValue(const clang::TemplateTypeParmDecl* decl);

    std::string name() const;
    bool isParameterPack() const;
    const clang::TemplateTypeParmDecl* decl() const;
};

} //  namespace parser
