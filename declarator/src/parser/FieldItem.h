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
#include <vector>

namespace parser
{

class FieldItem
{
    const clang::FieldDecl* m_decl;

public:
    FieldItem(const clang::FieldDecl* decl);

    std::string name() const;
    clang::QualType type() const;

    const clang::FieldDecl* decl() const;
};

} //  namespace parser
