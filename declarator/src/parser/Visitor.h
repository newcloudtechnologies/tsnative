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

#include <clang-c/Index.h>

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>

namespace parser
{

class Visitor
{
    CXTranslationUnit m_tu = nullptr;

public:
    enum Result
    {
        CONTINUE,
        IGNORE,
        RECURSE
    };

protected:
    virtual Result onVisit(const clang::NamedDecl* decl, bool isLocal) = 0;
    virtual void enterScope(const clang::NamedDecl* decl) = 0;
    virtual void releaseScope(const clang::NamedDecl* decl) = 0;

private:
    static bool valid(CXCursor cursor);
    static CXChildVisitResult visit(CXCursor current, CXCursor parent, CXClientData client_data);

public:
    Visitor(const CXTranslationUnit& tu);
    void start();
};

} //  namespace parser
