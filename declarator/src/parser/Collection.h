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

#include "AbstractItem.h"
#include "TranslationUnit.h"
#include "Visitor.h"

#include <clang-c/Index.h>

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <functional>
#include <optional>
#include <string>

namespace parser
{

class Collection
{
    class Finder;
    friend class Finder;

private:
    CXTranslationUnit m_tu = nullptr;
    item_t<TranslationUnitItem> m_root;

private:
    Collection();
    static Collection& do_ref();
    static Collection& do_init(CXTranslationUnit tu);
    void populate();

    template <typename Callable>
    void addItem(const std::string& name, const std::string& prefix, Callable createHandler);

    void addNamespace(const std::string& name,
                      const std::string& prefix,
                      bool isLocal,
                      const clang::NamespaceDecl* decl);

    void addClass(const std::string& name,
                  const std::string& prefix,
                  bool isLocal,
                  bool isCompletedDecl,
                  const clang::CXXRecordDecl* decl);

    void addClassTemplate(const std::string& name,
                          const std::string& prefix,
                          bool isLocal,
                          bool isCompletedDecl,
                          const clang::ClassTemplateDecl* decl);

    void addClassTemplateSpecialization(const std::string& name,
                                        const std::string& prefix,
                                        bool isLocal,
                                        bool isCompletedDecl,
                                        const clang::ClassTemplateSpecializationDecl* decl);

    void addEnum(const std::string& name,
                 const std::string& prefix,
                 bool isLocal,
                 bool isCompletedDecl,
                 const clang::EnumDecl* decl);

    void addFunction(const std::string& name,
                     const std::string& prefix,
                     bool isLocal,
                     bool isCompletedDecl,
                     const clang::FunctionDecl* decl);

    void addFunctionTemplate(const std::string& name,
                             const std::string& prefix,
                             bool isLocal,
                             bool isCompletedDecl,
                             const clang::FunctionTemplateDecl* decl);

    void addVariable(const std::string& name,
                     const std::string& prefix,
                     bool isLocal,
                     bool isCompletedDecl,
                     const clang::VarDecl* decl);

    container_item_t getContainerItem(const std::string& path) const;

public:
    static void init(CXTranslationUnit tu);
    static const Collection& ref();

    bool hasItem(const std::string& path, bool isCompletedDecl = true) const;
    bool hasItem(const std::string& parentPath, const std::string& name, bool isCompletedDecl = true) const;

    std::optional<const_abstract_item_t> findItem(const std::string& path) const;
    std::optional<const_abstract_item_t> findItem(const std::string& parentPath, const std::string& name) const;

    void visit(std::function<void(const_abstract_item_t item)> handler) const;
    void print(const std::string& filename = "collection.txt") const;
};

} //  namespace parser
