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

#include "Collection.h"
#include "AbstractItem.h"
#include "Annotation.h"
#include "ClassItem.h"
#include "ClassTemplateItem.h"
#include "CodeBlockItem.h"
#include "EnumItem.h"
#include "FunctionItem.h"
#include "FunctionTemplateItem.h"
#include "NamespaceItem.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/ASTContext.h>

#include <algorithm>
#include <deque>
#include <functional>
#include <vector>

namespace
{

using namespace parser;

const clang::Decl* getCursorDecl(const CXCursor& cursor)
{
    return static_cast<const clang::Decl*>(cursor.data[0]);
}

std::string getLocation(const clang::NamedDecl* decl)
{
    clang::SourceRange range = decl->getSourceRange();
    return range.printToString(decl->getASTContext().getSourceManager());
}

int sizeOf(const CXCursor& cursor)
{
    int result = -1;

    if (cursor.kind == CXCursorKind::CXCursor_ClassDecl)
    {
        auto type = clang_getCursorType(cursor);
        result = clang_Type_getSizeOf(type);
    }

    return result;
}

} // namespace

namespace parser
{

class Collection::Finder
{
    Collection& m_collection;

    std::vector<std::string> m_namespaces;
    std::vector<std::string> m_classes;

public:
    Finder(Collection& collection)
        : m_collection(collection)
    {
    }

private:
    void enterNamespace(const std::string& name)
    {
        m_namespaces.push_back(name);
    }

    void leaveNamespace()
    {
        m_namespaces.pop_back();
    }

    void enterClass(const std::string& name)
    {
        m_classes.push_back(name);
    }

    void leaveClass()
    {
        m_classes.pop_back();
    }

    std::string getPrefix() const
    {
        std::string result;
        std::vector<std::string> parts;

        parts.reserve(m_namespaces.size() + m_classes.size());
        parts.insert(parts.end(), m_namespaces.begin(), m_namespaces.end());
        parts.insert(parts.end(), m_classes.begin(), m_classes.end());

        for (auto i = 0; i < parts.size(); i++)
        {
            result += parts.at(i);

            if (i < parts.size() - 1)
            {
                result += "::";
            }
        }

        return result;
    }

    void addNamespace(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* namespaceDecl = clang::dyn_cast_or_null<const clang::NamespaceDecl>(decl);
        _ASSERT(namespaceDecl);

        m_collection.addNamespace(namespaceDecl->getNameAsString(), getPrefix(), isLocal, namespaceDecl);
    }

    void addClass(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* recordDecl = clang::dyn_cast_or_null<const clang::CXXRecordDecl>(decl);
        _ASSERT(recordDecl);

        // completed definition only
        if (!recordDecl->isThisDeclarationADefinition())
            return;

        // filter specializations
        if (!recordDecl->getTemplateInstantiationPattern())
        {
            m_collection.addClass(recordDecl->getNameAsString(), getPrefix(), isLocal, recordDecl);
        }
    }

    void addClassTemplate(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* classTemplateDecl = clang::dyn_cast_or_null<const clang::ClassTemplateDecl>(decl);
        _ASSERT(classTemplateDecl);

        // completed definition only
        if (!classTemplateDecl->isThisDeclarationADefinition())
            return;

        m_collection.addClassTemplate(classTemplateDecl->getNameAsString(), getPrefix(), isLocal, classTemplateDecl);

        clang::LangOptions lo;
        clang::PrintingPolicy pp(lo);
        pp.adjustForCPlusPlus();

        // specializations for current template declaration
        for (const auto& it : classTemplateDecl->specializations())
        {
            std::string specName = classTemplateDecl->getNameAsString();

            auto writenType = it->getTypeAsWritten();

            if (writenType)
            {
                specName = writenType->getType().getAsString(pp);
            }
            else
            {
                specName += "<";

                // template arguments
                auto args = it->getTemplateArgs().asArray();

                for (auto i = 0; i < args.size(); i++)
                {
                    std::string arg;

                    switch (args[i].getKind())
                    {
                        case clang::TemplateArgument::Type:
                        {
                            // type template argument: int, double, void *, ...
                            arg = args[i].getAsType().getCanonicalType().getAsString(pp);
                            break;
                        }
                        default:
                        {
                            // non-type template argument: (1), (2), (3), ...
                            arg = "(" + std::to_string(i) + ")";
                            break;
                        }
                    }

                    if (i < args.size() - 1)
                    {
                        specName += arg += ", ";
                    }
                    else
                    {
                        specName += arg;
                    }
                }

                specName += ">";
            }

            AnnotationList templateAnnotations(getAnnotations(classTemplateDecl));
            AnnotationList instantiationAnnotations(getAnnotations(it));

            // remove TS_EXPORT annotation from all template specifications
            if (templateAnnotations.exist("TS_EXPORT"))
            {
                instantiationAnnotations.remove("TS_EXPORT");
                setAnnotations(it, instantiationAnnotations.toString());
            }

            m_collection.addClass(specName, getPrefix(), isLocal, it);
        }
    }

    void addEnum(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* enumDecl = clang::dyn_cast_or_null<const clang::EnumDecl>(decl);
        _ASSERT(enumDecl);

        // completed definition only
        if (!enumDecl->isThisDeclarationADefinition())
            return;

        m_collection.addEnum(enumDecl->getNameAsString(), getPrefix(), isLocal, enumDecl);
    }

    void addFunction(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* funcDecl = clang::dyn_cast_or_null<const clang::FunctionDecl>(decl);
        _ASSERT(funcDecl);

        // function from local file only
        if (!isLocal)
            return;

        m_collection.addFunction(funcDecl->getNameAsString(), getPrefix(), isLocal, funcDecl);
    }

    void addFunctionTemplate(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* funcTemplateDecl = clang::dyn_cast_or_null<const clang::FunctionTemplateDecl>(decl);
        _ASSERT(funcTemplateDecl);

        // function from local file only
        if (!isLocal)
            return;

        m_collection.addFunctionTemplate(funcTemplateDecl->getNameAsString(), getPrefix(), isLocal, funcTemplateDecl);
    }

public:
    static CXChildVisitResult visitor(CXCursor current, CXCursor parent, CXClientData client_data)
    {
        auto* context = static_cast<Finder*>(client_data);
        const auto* decl = getCursorDecl(current);

        CXSourceLocation location = clang_getCursorLocation(current);
        bool isLocal = clang_Location_isFromMainFile(location) != 0;

        if (current.kind == CXCursorKind::CXCursor_Namespace)
        {
            const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
            _ASSERT(namedDecl);

            context->addNamespace(namedDecl, isLocal);

            std::string namespaceName = namedDecl->getNameAsString();

            context->enterNamespace(namespaceName);
            clang_visitChildren(current, Finder::visitor, (CXClientData)context);
            context->leaveNamespace();
        }
        else if (current.kind == CXCursorKind::CXCursor_ClassDecl || current.kind == CXCursorKind::CXCursor_StructDecl)
        {
            const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
            _ASSERT(namedDecl);

            context->addClass(namedDecl, isLocal);

            std::string className = namedDecl->getNameAsString();

            context->enterClass(className);
            clang_visitChildren(current, Finder::visitor, (CXClientData)context);
            context->leaveClass();
        }
        else if (current.kind == CXCursorKind::CXCursor_ClassTemplate)
        {
            const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
            _ASSERT(namedDecl);

            // TODO: looking for nested items inside class template
            context->addClassTemplate(namedDecl, isLocal);
        }
        else if (current.kind == CXCursorKind::CXCursor_EnumDecl)
        {
            const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
            _ASSERT(namedDecl);

            context->addEnum(namedDecl, isLocal);
        }
        else if (current.kind == CXCursorKind::CXCursor_FunctionDecl)
        {
            const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
            _ASSERT(namedDecl);

            context->addFunction(namedDecl, isLocal);
        }
        else if (current.kind == CXCursorKind::CXCursor_FunctionTemplate)
        {
            const auto* namedDecl = clang::dyn_cast_or_null<const clang::NamedDecl>(decl);
            _ASSERT(namedDecl);

            context->addFunctionTemplate(namedDecl, isLocal);
        }

        return CXChildVisit_Continue;
    }
};

//-------------------------------------------------------------------------

Collection::Collection()
{
    m_root = AbstractItem::make<TranslationUnitItem>();
}

Collection& Collection::do_get()
{
    static Collection inst;
    return inst;
}

void Collection::init(const CXCursor& cursor)
{
    auto& instance = Collection::do_get();
    instance.populate(cursor);
}

Collection& Collection::get()
{
    return Collection::do_get();
}

void Collection::populate(const CXCursor& cursor)
{
    Finder finder(*this);

    clang_visitChildren(cursor, Finder::visitor, (CXClientData)&finder);
}

bool Collection::existItem(const std::string& name, const std::string& path) const
{
    bool result = false;
    const_abstract_item_t item = getItem(path);

    if (name.empty())
        return result;

    if (AbstractItem::isContainer(item))
    {
        auto parent = std::static_pointer_cast<const ContainerItem>(item);
        for (const auto& it : parent->children())
        {
            if (it->name() == name)
            {
                result = true;
                break;
            }
        }
    }

    return result;
}

const_abstract_item_t Collection::getItem(const std::string& path) const
{
    abstract_item_t result;

    auto find = [path](const item_list_t& items, const std::string& name) -> abstract_item_t
    {
        auto it = std::find_if(items.begin(), items.end(), [name](const auto& it) { return it->name() == name; });

        if (it == items.end())
        {
            throw utils::Exception(R"(path "%s" is not correct: name "%s" is not found)", path.c_str(), name.c_str());
        }

        return *it;
    };

    auto split = [](std::string s)
    {
        std::deque<std::string> replacements;
        int _beg = 0;
        int _end = 0;

        std::string placeholder = "<>";

        // replace ns1::ns2::Template1<X::Y::Z>::Template2<A::B::C> -> ns1::ns2::Template1<>::Template2<>
        // replacements: [<X::Y::Z>, <A::B::C>]
        while (1)
        {
            _beg = s.find("<", _beg);
            _end = s.find(">", _beg);

            if (_beg > 0 && _end > 0)
            {
                std::string part = s.substr(_beg, _end - _beg + 1);
                s.replace(_beg, part.size(), placeholder);
                replacements.push_back(part);

                _beg++;
            }
            else
            {
                break;
            }
        };

        // ns1::ns2::Template1<>::Template2<> -> [ns1, ns2, Template1<>, Template2<>]
        std::vector<std::string> parts = utils::split(s, "::");

        // parts: [ns1, ns2, Template1<X::Y::Z>, Template2<A::B::C>]
        for (auto& part : parts)
        {
            int index = part.find(placeholder);
            if (index > 0)
            {
                part.replace(index, placeholder.size(), replacements.front());
                replacements.pop_front();
            }
        }

        return parts;
    };

    if (path.empty())
    {
        return m_root;
    }

    item_list_t items = m_root->children();

    std::vector<std::string> names = split(path);

    for (auto i = 0; i < names.size(); i++)
    {
        std::string name = names.at(i);

        abstract_item_t item = find(items, name);

        // not last element
        if (i < names.size() - 1)
        {
            if (!AbstractItem::isContainer(item))
            {
                throw utils::Exception(
                    R"(path "%s" is not correct: name "%s" is not a namespace or class)", path.c_str(), name.c_str());
            }

            auto containerItem = std::static_pointer_cast<ContainerItem>(item);

            items = containerItem->children();
        }
        else
        {
            result = item;
        }
    }

    return result;
}

abstract_item_t Collection::getItem(const std::string& path)
{
    return std::const_pointer_cast<AbstractItem>(const_cast<const Collection*>(this)->getItem(path));
}

void Collection::visit(std::function<void(const abstract_item_t item)> handler) const
{
    std::function<void(abstract_item_t item)> do_visit = [&do_visit, handler](abstract_item_t item)
    {
        handler(item);

        if (AbstractItem::isContainer(item))
        {
            auto containerItem = std::static_pointer_cast<ContainerItem>(item);

            for (const auto& it : containerItem->children())
            {
                do_visit(it);
            }
        }
    };

    for (const auto& it : m_root->children())
    {
        do_visit(it);
    }
}

void Collection::addNamespace(const std::string& name,
                              const std::string& prefix,
                              bool isLocal,
                              const clang::NamespaceDecl* decl)
{
    if (!existItem(name, prefix))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(getItem(prefix));
        auto item = AbstractItem::make<NamespaceItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addClass(const std::string& name,
                          const std::string& prefix,
                          bool isLocal,
                          const clang::CXXRecordDecl* decl)
{
    if (!existItem(name, prefix))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(getItem(prefix));
        parser::class_item_t item;

        AnnotationList annotations(getAnnotations(decl));

        if (annotations.exist("TS_CODE"))
        {
            item = AbstractItem::make<CodeBlockItem>(name, prefix, decl);
        }
        else
        {
            item = AbstractItem::make<ClassItem>(name, prefix, isLocal, decl);
        }

        parent->addItem(item);
    }
}

void Collection::addClassTemplate(const std::string& name,
                                  const std::string& prefix,
                                  bool isLocal,
                                  const clang::ClassTemplateDecl* decl)
{
    if (!existItem(name, prefix))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(getItem(prefix));
        auto item = AbstractItem::make<ClassTemplateItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addEnum(const std::string& name, const std::string& prefix, bool isLocal, const clang::EnumDecl* decl)
{
    if (!existItem(name, prefix))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(getItem(prefix));
        auto item = AbstractItem::make<EnumItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addFunction(const std::string& name,
                             const std::string& prefix,
                             bool isLocal,
                             const clang::FunctionDecl* decl)
{
    if (!existItem(name, prefix))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(getItem(prefix));
        auto item = AbstractItem::make<FunctionItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addFunctionTemplate(const std::string& name,
                                     const std::string& prefix,
                                     bool isLocal,
                                     const clang::FunctionTemplateDecl* decl)
{
    if (!existItem(name, prefix))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(getItem(prefix));
        auto item = AbstractItem::make<FunctionTemplateItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

} //  namespace parser
