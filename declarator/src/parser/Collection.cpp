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

#include "global/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/ASTContext.h>

#include <algorithm>
#include <deque>
#include <functional>
#include <iterator>
#include <vector>

namespace
{

using namespace parser;

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

template <typename T>
inline typename T::value_type _expectedOne(T&& container)
{
    _ASSERT(container.size() == 1);
    return container.at(0);
}

} // namespace

namespace parser
{

class Collection::Finder : public Visitor
{
    Collection& m_collection;

public:
    Finder(const CXTranslationUnit& tu, Collection& collection)
        : Visitor(tu)
        , m_collection(collection)
    {
    }

private:
    Result onVisit(const clang::NamedDecl* decl, bool isLocal) override
    {
        using namespace clang;

        auto kind = decl->getKind();

        switch (kind)
        {
            case Decl::Kind::Namespace:
            {
                addNamespace(decl, isLocal);
                return Result::RECURSE;
            }
            case Decl::Kind::CXXRecord:
            {
                addClass(decl, isLocal);
                return Result::RECURSE;
            }
            case Decl::Kind::ClassTemplate:
            {
                addClassTemplate(decl, isLocal);
                return Result::CONTINUE;
            }
            case Decl::Kind::Enum:
            {
                addEnum(decl, isLocal);
                return Result::CONTINUE;
            }
            case Decl::Kind::Function:
            {
                addFunction(decl, isLocal);
                return Result::CONTINUE;
            }
            case Decl::Kind::FunctionTemplate:
            {
                addFunctionTemplate(decl, isLocal);
                return Result::CONTINUE;
            }
            default:
            {
                return Result::IGNORE;
            }
        };
    }

    void enterScope(const clang::NamedDecl* decl) override
    {
    }

    void releaseScope(const clang::NamedDecl* decl) override
    {
    }

private:
    void getPrefixAndName(const std::string& qualifiedName, std::string& prefix, std::string& name)
    {
        using namespace utils;

        if (!qualifiedName.empty())
        {
            std::vector<std::string> parts = split(qualifiedName, "::");

            _ASSERT(!parts.empty());

            if (parts.size() > 1)
            {
                name = parts.back();
                parts.pop_back();
                prefix = join(parts, "::");
            }
            else if (parts.size() == 1)
            {
                name = parts.at(0);
            }
        }
    }

    void addNamespace(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* namespaceDecl = clang::dyn_cast_or_null<const clang::NamespaceDecl>(decl);
        _ASSERT(namespaceDecl);

        std::string prefix, name;
        std::string qualifiedName = namespaceDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addNamespace(name, prefix, isLocal, namespaceDecl);
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
            std::string prefix, name;
            std::string qualifiedName = recordDecl->getQualifiedNameAsString();
            getPrefixAndName(qualifiedName, prefix, name);

            m_collection.addClass(name, prefix, isLocal, recordDecl);
        }
    }

    void addClassTemplate(const clang::NamedDecl* decl, bool isLocal)
    {
        using namespace global::annotations;

        const auto* classTemplateDecl = clang::dyn_cast_or_null<const clang::ClassTemplateDecl>(decl);
        _ASSERT(classTemplateDecl);

        // completed definition only
        if (!classTemplateDecl->isThisDeclarationADefinition())
            return;

        std::string prefix, name;
        std::string qualifiedName = classTemplateDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addClassTemplate(name, prefix, isLocal, classTemplateDecl);

        clang::LangOptions lo;
        clang::PrintingPolicy pp(lo);
        pp.adjustForCPlusPlus();

        // specializations for current template declaration
        for (const auto& it : classTemplateDecl->specializations())
        {
            std::string specName = name;

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
            if (templateAnnotations.exist(TS_EXPORT))
            {
                instantiationAnnotations.remove(TS_EXPORT);
                setAnnotations(it, instantiationAnnotations.toString());
            }

            m_collection.addClass(specName, prefix, isLocal, it);
        }
    }

    void addEnum(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* enumDecl = clang::dyn_cast_or_null<const clang::EnumDecl>(decl);
        _ASSERT(enumDecl);

        // completed definition only
        if (!enumDecl->isThisDeclarationADefinition())
            return;

        std::string prefix, name;
        std::string qualifiedName = enumDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addEnum(name, prefix, isLocal, enumDecl);
    }

    void addFunction(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* funcDecl = clang::dyn_cast_or_null<const clang::FunctionDecl>(decl);
        _ASSERT(funcDecl);

        // function from local file only
        if (!isLocal)
            return;

        std::string prefix, name;
        std::string qualifiedName = funcDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addFunction(name, prefix, isLocal, funcDecl);
    }

    void addFunctionTemplate(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* funcTemplateDecl = clang::dyn_cast_or_null<const clang::FunctionTemplateDecl>(decl);
        _ASSERT(funcTemplateDecl);

        // function from local file only
        if (!isLocal)
            return;

        std::string prefix, name;
        std::string qualifiedName = funcTemplateDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addFunctionTemplate(name, prefix, isLocal, funcTemplateDecl);
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

Collection& Collection::do_init(CXTranslationUnit tu)
{
    auto& instance = Collection::do_get();
    instance.m_tu = tu;
    return instance;
}

void Collection::init(CXTranslationUnit tu)
{
    auto& instance = Collection::do_init(tu);
    instance.populate();
}

Collection& Collection::get()
{
    return Collection::do_get();
}

void Collection::populate()
{
    Finder finder(m_tu, *this);

    finder.start();
}

bool Collection::existItem(const std::string& path, const std::string& name) const
{
    const_item_list_t items = getItems(path, name);

    return !items.empty();
}

const_item_list_t Collection::getItems(const std::string& path) const
{
    auto items = const_cast<Collection*>(this)->getItems(path);
    return {items.begin(), items.end()};
}

item_list_t Collection::getItems(const std::string& path)
{
    item_list_t result;

    auto find_all = [path](const item_list_t& items, const std::string& name) -> item_list_t
    {
        item_list_t result;
        std::copy_if(items.begin(),
                     items.end(),
                     std::back_inserter(result),
                     [name](const auto& it) { return it->name() == name; });

        if (result.empty())
        {
            throw utils::Exception(
                R"(path "%s" is not correct: no any item with name "%s")", path.c_str(), name.c_str());
        }

        return result;
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
        return {m_root};
    }

    item_list_t children = m_root->children();

    std::vector<std::string> names = split(path);

    for (auto i = 0; i < names.size(); i++)
    {
        std::string name = names.at(i);

        // not last element
        if (i < names.size() - 1)
        {
            item_list_t items = find_all(children, name);

            if (items.size() != 1)
            {
                throw utils::Exception(
                    R"(path "%s" is not correct: many items "%s" found)", path.c_str(), name.c_str());
            }

            abstract_item_t item = items.at(0);

            if (!AbstractItem::isContainer(item))
            {
                throw utils::Exception(
                    R"(path "%s" is not correct: name "%s" is not a namespace or class)", path.c_str(), name.c_str());
            }

            auto containerItem = std::static_pointer_cast<ContainerItem>(item);

            children = containerItem->children();
        }
        else
        {
            result = find_all(children, name);
        }
    }

    return result;
}

const_item_list_t Collection::getItems(const std::string& parentPath, const std::string& name) const
{
    auto items = const_cast<Collection*>(this)->getItems(parentPath, name);
    return {items.begin(), items.end()};
}

item_list_t Collection::getItems(const std::string& parentPath, const std::string& name)
{
    item_list_t result;
    item_list_t items = getItems(parentPath);

    if (items.size() != 1)
    {
        throw utils::Exception(R"(many items found with this path: "%s")", parentPath.c_str());
    }

    abstract_item_t item = items.at(0);

    if (name.empty())
        return result;

    if (AbstractItem::isContainer(item))
    {
        auto parent = std::static_pointer_cast<const ContainerItem>(item);
        item_list_t children = parent->children();

        std::copy_if(children.begin(),
                     children.end(),
                     std::back_inserter(result),
                     [name](const auto& it) { return it->name() == name; });
    }

    return result;
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
    using namespace global::annotations;

    AnnotationList annotations(getAnnotations(decl));

    // Local namespace declaration needs to handle annotations (do not forget, processed header is local)
    // Non-local namespace declarations needs to build hierarchy of entities (namespace -> classes and functions, etc)
    // Local entities refer to non-local

    if (existItem(prefix, name))
    {
        // Replace existed namespace declaration by "local"
        abstract_item_t item = _expectedOne(getItems(prefix, name));
        _ASSERT(item->type() == AbstractItem::Type::NAMESPACE);

        // update declaration if new is annotated because this ones more important for us
        // for example: we include headers from  mgt (no annotations) first,
        // and next include headers from mgt-ts (with annotations)
        if (!item->isLocal() && (annotations.exist(TS_MODULE) || annotations.exist(TS_NAMESPACE)))
        {
            auto namespaceItem = std::static_pointer_cast<NamespaceItem>(item);
            namespaceItem->setDecl(decl);
        }

        // update declaration if new is local and old was not local
        if (!item->isLocal() && isLocal)
        {
            auto namespaceItem = std::static_pointer_cast<NamespaceItem>(item);
            namespaceItem->setDecl(decl);
            namespaceItem->setLocal(true);
        }
    }
    else
    {
        // Put to collection first namespace declaration
        auto parent = std::static_pointer_cast<ContainerItem>(_expectedOne(getItems(prefix)));
        auto item = AbstractItem::make<NamespaceItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addClass(const std::string& name,
                          const std::string& prefix,
                          bool isLocal,
                          const clang::CXXRecordDecl* decl)
{
    using namespace global::annotations;

    if (!existItem(prefix, name))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(_expectedOne(getItems(prefix)));
        parser::class_item_t item;

        AnnotationList annotations(getAnnotations(decl));

        if (annotations.exist(TS_CODE))
        {
            item = AbstractItem::make<CodeBlockItem>(name, prefix, isLocal, decl);
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
    if (!existItem(prefix, name))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(_expectedOne(getItems(prefix)));
        auto item = AbstractItem::make<ClassTemplateItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addEnum(const std::string& name, const std::string& prefix, bool isLocal, const clang::EnumDecl* decl)
{
    if (!existItem(prefix, name))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(_expectedOne(getItems(prefix)));
        auto item = AbstractItem::make<EnumItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addFunction(const std::string& name,
                             const std::string& prefix,
                             bool isLocal,
                             const clang::FunctionDecl* decl)
{
    if (!existItem(prefix, name))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(_expectedOne(getItems(prefix)));
        auto item = AbstractItem::make<FunctionItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addFunctionTemplate(const std::string& name,
                                     const std::string& prefix,
                                     bool isLocal,
                                     const clang::FunctionTemplateDecl* decl)
{
    if (!existItem(prefix, name))
    {
        auto parent = std::static_pointer_cast<ContainerItem>(_expectedOne(getItems(prefix)));
        auto item = AbstractItem::make<FunctionTemplateItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

} //  namespace parser
