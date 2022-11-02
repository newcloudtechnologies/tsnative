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

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>

#include <string>

namespace parser
{

class ParameterValue
{
    const clang::ParmVarDecl* m_decl;

public:
    ParameterValue(const clang::ParmVarDecl* decl);

    std::string name() const;
    clang::QualType type() const;
    bool isParameterPack() const;
    bool isPointerType() const;
    bool isTemplated() const;
    const clang::ParmVarDecl* decl() const;
};

} //  namespace parser
