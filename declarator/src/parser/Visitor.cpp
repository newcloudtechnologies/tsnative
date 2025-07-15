#include "Visitor.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/ASTContext.h>

namespace
{

const clang::Decl* getCursorDecl(const CXCursor& cursor)
{
    return static_cast<const clang::Decl*>(cursor.data[0]);
}

std::string toStdString(CXString s)
{
    std::string result(clang_getCString(s));
    clang_disposeString(s);

    return result;
}

std::string getLocation(const clang::NamedDecl* decl)
{
    clang::SourceRange range = decl->getSourceRange();
    return range.printToString(decl->getASTContext().getSourceManager());
}

class NamespaceChecker
{
    bool m_isLocal = false;

private:
    static CXChildVisitResult visitor(CXCursor current, CXCursor parent, CXClientData client_data);
    static std::string getName(CXCursor cursor);

public:
    NamespaceChecker() = default;

    static bool isLocal(CXCursor cursor);
};

CXChildVisitResult NamespaceChecker::visitor(CXCursor current, CXCursor parent, CXClientData client_data)
{
    auto* context = static_cast<NamespaceChecker*>(client_data);

#ifndef NDEBUG
    std::string name = getName(current);
#endif

    // Looking for entities (recursively) inside namespace and checking: does it local or not
    // If namespace contains local entity it means namespace is local
    if (!context->m_isLocal)
    {
        if (current.kind == CXCursorKind::CXCursor_Namespace)
        {
            clang_visitChildren(current, NamespaceChecker::visitor, client_data);
        }

        if (!context->m_isLocal)
        {
            CXSourceLocation location = clang_getCursorLocation(current);
            context->m_isLocal = clang_Location_isFromMainFile(location) != 0 ? true : false;
        }

        return CXChildVisit_Continue;
    }
    else
    {
        return CXChildVisit_Break;
    }
}

std::string NamespaceChecker::getName(CXCursor cursor)
{
    auto* decl = getCursorDecl(cursor);
    const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
    return namedDecl ? namedDecl->getNameAsString() : "";
}

bool NamespaceChecker::isLocal(CXCursor cursor)
{
    NamespaceChecker context;

#ifndef NDEBUG
    std::string name = getName(cursor);
#endif

    clang_visitChildren(cursor, NamespaceChecker::visitor, (CXClientData)&context);

    return context.m_isLocal;
}

} //  namespace

namespace parser
{

bool Visitor::valid(CXCursor cursor)
{
    switch (cursor.kind)
    {
        case CXCursorKind::CXCursor_Namespace:
        case CXCursorKind::CXCursor_NamespaceAlias:
        case CXCursorKind::CXCursor_ClassDecl:
        case CXCursorKind::CXCursor_StructDecl:
        case CXCursorKind::CXCursor_ClassTemplate:
        case CXCursorKind::CXCursor_ClassTemplatePartialSpecialization:
        case CXCursorKind::CXCursor_EnumDecl:
        case CXCursorKind::CXCursor_FunctionDecl:
        case CXCursorKind::CXCursor_FunctionTemplate:
        case CXCursorKind::CXCursor_VarDecl:
        {
            return true;
        }
        default:
        {
            return false;
        }
    };
}

CXChildVisitResult Visitor::visit(CXCursor current, CXCursor parent, CXClientData client_data)
{
    auto* context = static_cast<Visitor*>(client_data);
    const auto* decl = getCursorDecl(current);

    if (valid(current))
    {
        const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
        _ASSERT(namedDecl);

#ifndef NDEBUG
        std::string name = namedDecl->getNameAsString();
#endif

        bool isLocal = false;

        if (current.kind == CXCursorKind::CXCursor_Namespace)
        {
            isLocal = NamespaceChecker::isLocal(current);
        }
        else
        {
            CXFile file;
            unsigned int line, colomn;
            CXSourceLocation location = clang_getCursorLocation(current);
            clang_getExpansionLocation(location, &file, &line, &colomn, NULL);

            std::string current_file = toStdString(clang_getFileName(file));
            std::string main_file = toStdString(clang_getTranslationUnitSpelling(context->m_tu));

            // included standard file TS.h is local too
            isLocal = (current_file == main_file) || utils::ends_with(current_file, "include/TS.h") ||
                      utils::ends_with(current_file, "include\\TS.h");
        }

        if (context->onVisit(namedDecl, isLocal) == Result::RECURSE)
        {
            context->enterScope(namedDecl);
            clang_visitChildren(current, Visitor::visit, (CXClientData)context);
            context->releaseScope(namedDecl);
        }
    }

    return CXChildVisit_Continue;
}

Visitor::Visitor(const CXTranslationUnit& tu)
    : m_tu(tu)
{
}

void Visitor::start()
{
    CXCursor cursor = clang_getTranslationUnitCursor(m_tu);

    clang_visitChildren(cursor, Visitor::visit, (CXClientData)this);
}

} //  namespace parser
