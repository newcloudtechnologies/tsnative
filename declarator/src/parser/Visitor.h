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
