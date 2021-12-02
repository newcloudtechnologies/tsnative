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

#include "TranslationUnit.h"

#include <clang-c/Index.h>

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>

#include <functional>
#include <string>

namespace parser
{

class Collection
{
    class Finder;
    friend class Finder;

private:
    item_t<TranslationUnitItem> m_root;

private:
    void addNamespace(const std::string& name,
                      const std::string& prefix,
                      bool isLocal,
                      const clang::NamespaceDecl* decl);

    void addClass(const std::string& name, const std::string& prefix, bool isLocal, const clang::CXXRecordDecl* decl);

    void addClassTemplate(const std::string& name,
                          const std::string& prefix,
                          bool isLocal,
                          const clang::ClassTemplateDecl* decl);

    void addEnum(const std::string& name, const std::string& prefix, bool isLocal, const clang::EnumDecl* decl);

    void addFunction(const std::string& name, const std::string& prefix, bool isLocal, const clang::FunctionDecl* decl);

private:
    Collection();
    static Collection& do_get();
    void populate(const CXCursor& cursor);

public:
    static void init(const CXCursor& cursor);
    static Collection& get();

    bool existItem(const std::string& name, const std::string& path) const;
    const_abstract_item_t getItem(const std::string& path) const;
    abstract_item_t getItem(const std::string& path);

    void visit(std::function<void(const abstract_item_t item)> handler) const;
};

} //  namespace parser
