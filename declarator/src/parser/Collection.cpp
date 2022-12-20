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

#include "Collection.h"
#include "AbstractItem.h"
#include "Annotation.h"
#include "ClassItem.h"
#include "ClassTemplateItem.h"
#include "ClassTemplateSpecializationItem.h"
#include "CodeBlockItem.h"
#include "EnumItem.h"
#include "FunctionItem.h"
#include "FunctionTemplateItem.h"
#include "NamespaceItem.h"
#include "Utils.h"
#include "VariableItem.h"

#include "global/Annotations.h"

#include "utils/Exception.h"
#include "utils/LambdaTraits.h"
#include "utils/Strings.h"

#include <clang/AST/ASTContext.h>

#include <algorithm>
#include <fstream>
#include <functional>
#include <iterator>
#include <regex>
#include <set>
#include <vector>

namespace
{

using namespace parser;

class SelectItems
{
    static bool is_template(parser::const_abstract_item_t item)
    {
        auto type = item->type();
        return type == AbstractItem::Type::CLASS_TEMPLATE || type == AbstractItem::Type::CLASS_TEMPLATE_SPECIALIZATION;
    }

    static bool parse_template(const std::string& s, std::string& name, std::vector<std::string>& params)
    {
        bool result = false;

        static std::set<std::string> cache;

        if (cache.find(s) == cache.end())
        {
            std::regex regexp{R"(^([\<\>\:\w]+)(\<(.+)\>)$)"}; // ml<S>::ClassName<T*, A<R::T>>
            std::smatch match;

            result = std::regex_search(s.begin(), s.end(), match, regexp);

            if (result)
            {
                name = match[1];
                std::string s_params = match[3];

                if (!s_params.empty())
                {
                    regexp = R"(([^,^\s]+))"; // T*, A<R::T>
                    auto _begin = std::sregex_iterator(s_params.begin(), s_params.end(), regexp);
                    auto _end = std::sregex_iterator();

                    std::transform(_begin, _end, std::back_inserter(params), [](auto it) { return it.str(); });
                }
            }
            else
            {
                cache.insert(s);
            }
        }

        return result;
    }

    static bool predicate(const std::string& name, parser::const_abstract_item_t item)
    {
        bool result = false;
        std::string actual_name = name;

        auto matched = [item](const std::string& name) { return item->name() == name; };

        result = matched(actual_name);

        if (!result)
        {
            if (is_template(item))
            {
                std::vector<std::string> params;
                result = parse_template(actual_name, actual_name, params);

                if (result)
                {
                    // TODO: match template parameters
                    result = matched(actual_name);
                }
            }
        }

        return result;
    }

public:
    // Returns all items with the same name, e.g. MyTemplate, MyTemplate<int>, MyTemplate<string>, etc
    // i.e template and template specializations
    static item_list_t all(const item_list_t& items, const std::string& name)
    {
        item_list_t result;
        std::copy_if(items.begin(),
                     items.end(),
                     std::back_inserter(result),
                     [name](parser::const_abstract_item_t item) { return predicate(name, item); });

        return result;
    }
};

} //  namespace

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

#ifndef NDEBUG
        std::string name = decl->getNameAsString();
#endif

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
                return Result::RECURSE;
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
            case Decl::Kind::Var:
            {
                addVariable(decl, isLocal);
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

        bool isCompletedDecl = recordDecl->isThisDeclarationADefinition();

        // filter specializations
        if (!recordDecl->getTemplateInstantiationPattern())
        {
            std::string prefix, name;
            std::string qualifiedName = recordDecl->getQualifiedNameAsString();
            getPrefixAndName(qualifiedName, prefix, name);

            m_collection.addClass(name, prefix, isLocal, isCompletedDecl, recordDecl);
        }
    }

    void addClassTemplate(const clang::NamedDecl* decl, bool isLocal)
    {
        using namespace global::annotations;

        const auto* classTemplateDecl = clang::dyn_cast_or_null<const clang::ClassTemplateDecl>(decl);
        _ASSERT(classTemplateDecl);

        bool isCompletedDecl = classTemplateDecl->isThisDeclarationADefinition();

        std::string prefix, name;
        std::string qualifiedName = classTemplateDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addClassTemplate(name, prefix, isLocal, isCompletedDecl, classTemplateDecl);

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

            // remove TS_EXPORT and TS_DECLARE annotations from all template specializations
            if (templateAnnotations.exist(TS_EXPORT) || templateAnnotations.exist(TS_DECLARE))
            {
                instantiationAnnotations.remove(TS_EXPORT);
                instantiationAnnotations.remove(TS_DECLARE);
                setAnnotations(it, instantiationAnnotations.toString());
            }

            bool isCompletedDecl = it->isThisDeclarationADefinition();

            m_collection.addClassTemplateSpecialization(specName, prefix, isLocal, isCompletedDecl, it);
        }
    }

    void addEnum(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* enumDecl = clang::dyn_cast_or_null<const clang::EnumDecl>(decl);
        _ASSERT(enumDecl);

        bool isCompletedDecl = enumDecl->isThisDeclarationADefinition();

        std::string prefix, name;
        std::string qualifiedName = enumDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addEnum(name, prefix, isLocal, isCompletedDecl, enumDecl);
    }

    void addFunction(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* funcDecl = clang::dyn_cast_or_null<const clang::FunctionDecl>(decl);
        _ASSERT(funcDecl);

        // function from local file only
        if (!isLocal)
            return;

        bool isCompletedDecl = funcDecl->isThisDeclarationADefinition();

        std::string prefix, name;
        std::string qualifiedName = funcDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addFunction(name, prefix, isLocal, isCompletedDecl, funcDecl);
    }

    void addFunctionTemplate(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* funcTemplateDecl = clang::dyn_cast_or_null<const clang::FunctionTemplateDecl>(decl);
        _ASSERT(funcTemplateDecl);

        // function from local file only
        if (!isLocal)
            return;

        bool isCompletedDecl = funcTemplateDecl->isThisDeclarationADefinition();

        std::string prefix, name;
        std::string qualifiedName = funcTemplateDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addFunctionTemplate(name, prefix, isLocal, isCompletedDecl, funcTemplateDecl);
    }

    void addVariable(const clang::NamedDecl* decl, bool isLocal)
    {
        const auto* varDecl = clang::dyn_cast_or_null<const clang::VarDecl>(decl);
        _ASSERT(varDecl);

        // variables from local file only
        if (!isLocal)
            return;

        std::string prefix, name;
        std::string qualifiedName = varDecl->getQualifiedNameAsString();
        getPrefixAndName(qualifiedName, prefix, name);

        m_collection.addVariable(name, prefix, isLocal, true, varDecl);
    }
};

//-------------------------------------------------------------------------

Collection::Collection()
{
    m_root = AbstractItem::make<TranslationUnitItem>();
}

Collection& Collection::do_ref()
{
    static Collection inst;
    return inst;
}

Collection& Collection::do_init(CXTranslationUnit tu)
{
    auto& instance = Collection::do_ref();
    instance.m_tu = tu;
    return instance;
}

void Collection::init(CXTranslationUnit tu)
{
    auto& instance = Collection::do_init(tu);
    instance.populate();
}

const Collection& Collection::ref()
{
    return Collection::do_ref();
}

void Collection::populate()
{
    Finder finder(m_tu, *this);

    finder.start();
}

bool Collection::hasItem(const std::string& path, bool isCompletedDecl) const
{
    const std::optional<const_abstract_item_t> result = findItem(path);
    if (!result.has_value())
    {
        return false;
    }
    return isCompletedDecl ? result->get()->isCompletedDecl() : true;
}

bool Collection::hasItem(const std::string& parentPath, const std::string& name, bool isCompletedDecl) const
{
    const std::optional<const_abstract_item_t> result = findItem(parentPath, name);
    if (!result.has_value())
    {
        return false;
    }
    return isCompletedDecl ? result->get()->isCompletedDecl() : true;
}

container_item_t Collection::getContainerItem(const std::string& path) const
{
    std::optional<const_abstract_item_t> result = findItem(path);
    _ASSERT(result.has_value());
    abstract_item_t item = std::const_pointer_cast<AbstractItem>(*result);
    container_item_t container = std::static_pointer_cast<ContainerItem>(item);
    return container;
}

std::optional<const_abstract_item_t> Collection::findItem(const std::string& path) const
{
    if (path.empty())
    {
        return {m_root};
    }

    std::optional<abstract_item_t> result = {};

    item_list_t children = m_root->children();

    std::vector<std::string> names = splitPath(path);

    for (auto i = 0; i < names.size(); i++)
    {
        std::string name = names.at(i);

        // not last element
        if (i < names.size() - 1)
        {
            item_list_t all = SelectItems::all(children, name);

            if (all.empty())
            {
                throw utils::Exception(
                    R"(path "%s" is not correct: no any item "%s" found)", path.c_str(), name.c_str());
            }

            if (all.size() != 1)
            {
                throw utils::Exception(
                    R"(path "%s" is not correct: many items "%s" found)", path.c_str(), name.c_str());
            }

            abstract_item_t item = all.at(0);

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
            // get all items with similar names, such MyTemplate, MyTemplate<int>, MyTemplate<string>, etc
            auto all = SelectItems::all(children, name);

            item_list_t found;

            // find full match: e.g MyTemplate<int> or MyClass
            std::copy_if(
                all.begin(), all.end(), std::back_inserter(found), [name](auto it) { return it->name() == name; });

            if (found.empty())
            {
                // MyTemplate<T> - is not specialization, this is template MyTemplate
                std::copy_if(all.begin(),
                             all.end(),
                             std::back_inserter(found),
                             [](auto it) { return it->type() == AbstractItem::Type::CLASS_TEMPLATE; });
            }

            if (found.size() == 1)
            {
                result = {found.at(0)};
                _ASSERT(*result);
            }
        }
    }
    return result;
}

std::optional<const_abstract_item_t> Collection::findItem(const std::string& parentPath, const std::string& name) const
{
    std::optional<abstract_item_t> result = {};

    if (name.empty())
    {
        return result;
    }

    std::optional<const_abstract_item_t> item = findItem(parentPath);
    _ASSERT(item.has_value());

    if (AbstractItem::isContainer(*item))
    {
        auto parent = std::static_pointer_cast<const ContainerItem>(*item);
        item_list_t children = parent->children();

        item_list_t found;
        std::copy_if(children.begin(),
                     children.end(),
                     std::back_inserter(found),
                     [name](const auto& it) { return it->name() == name; });

        if (found.size() == 1)
        {
            result = {found.at(0)};
            _ASSERT(*result);
        }
    }

    return result;
}

void Collection::visit(std::function<void(const_abstract_item_t item)> handler) const
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

template <typename Callable>
void Collection::addItem(const std::string& name, const std::string& prefix, Callable createHandler)
{
    using return_type_t = typename utils::lambda_traits<Callable>::return_type_t;
    using T = typename return_type_t::element_type;

    std::optional<const_abstract_item_t> item = findItem(prefix, name);
    container_item_t parent = getContainerItem(prefix);
    if (!item.has_value()) // no any item (completed or incompleted)
    {
        parent->addItem(createHandler());
    }
    else // item exist, if it is incomplete, call createHandler() for it
    {
        if (!(*item)->isCompletedDecl())
        {
            auto new_item = createHandler();
            parent->replaceItem((*item)->name(), (*item)->prefix(), new_item);
        }
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
    // Non-local namespace declarations needs to build hierarchy of entities (namespace -> classes and functions,
    // etc) Local entities refer to non-local
    if (hasItem(prefix, name))
    {
        // Replace existing namespace declaration by "local"
        auto o_item = findItem(prefix, name);
        _ASSERT(o_item.has_value());
        auto item = std::const_pointer_cast<AbstractItem>(*o_item);
        _ASSERT(item->type() == AbstractItem::Type::NAMESPACE);
        auto namespaceItem = std::static_pointer_cast<NamespaceItem>(item);

        // check: forward declaration must not to have annotations
        auto isDuplicateDeclaration = [A1 = annotations, namespaceItem]()
        {
            AnnotationList A2(getAnnotations(namespaceItem->decl()));

            return (A1.exist(TS_MODULE) || A1.exist(TS_NAMESPACE)) && namespaceItem->isLocal() &&
                   (A2.exist(TS_MODULE) || A2.exist(TS_NAMESPACE));
        };

        // forward declaration must be a local and without annotations
        auto isForwardDeclaration = [namespaceItem]()
        {
            AnnotationList A2(getAnnotations(namespaceItem->decl()));

            return namespaceItem->isLocal() && !(A2.exist(TS_MODULE) || A2.exist(TS_NAMESPACE));
        };

        // exclude annotated namespace duplication
        // for example: we do forward declarations and namespaces were annotated first and
        // after that we declare the same namespaces with new annotations
        if (isDuplicateDeclaration())
        {
            throw utils::Exception(
                R"(annotated namespace duplication detected: name: "%s", prefix: "%s")", name.c_str(), prefix.c_str());
        }

        // update declaration if new one is annotated (previous one wasn't annotated)
        // because this ones more important for us
        // for example: we include headers from  mgt (no annotations) first,
        // and next include headers from mgt-ts (with annotations)
        if ((!item->isLocal() || isForwardDeclaration()) &&
            (annotations.exist(TS_MODULE) || annotations.exist(TS_NAMESPACE)))
        {
            namespaceItem->setDecl(decl);
        }

        // update declaration if new one is local and old was not local
        if (!item->isLocal() && isLocal)
        {
            namespaceItem->setDecl(decl);
            namespaceItem->setLocal(true);
        }
    }
    else
    {
        // Put to collection first namespace declaration
        container_item_t parent = getContainerItem(prefix);
        auto item = AbstractItem::make<NamespaceItem>(name, prefix, isLocal, decl);
        parent->addItem(item);
    }
}

void Collection::addClass(const std::string& name,
                          const std::string& prefix,
                          bool isLocal,
                          bool isCompletedDecl,
                          const clang::CXXRecordDecl* decl)
{
    addItem(name,
            prefix,
            [name, prefix, isLocal, isCompletedDecl, decl]()
            {
                using namespace global::annotations;

                parser::class_item_t item;

                AnnotationList annotations(getAnnotations(decl));

                if (annotations.exist(TS_CODE))
                {
                    item = AbstractItem::make<CodeBlockItem>(name, prefix, isLocal, decl);
                }
                else
                {
                    item = AbstractItem::make<ClassItem>(name, prefix, isLocal, isCompletedDecl, decl);
                }

                return item;
            });
}

void Collection::addClassTemplate(const std::string& name,
                                  const std::string& prefix,
                                  bool isLocal,
                                  bool isCompletedDecl,
                                  const clang::ClassTemplateDecl* decl)
{
    addItem(name,
            prefix,
            [name, prefix, isLocal, isCompletedDecl, decl]()
            { return AbstractItem::make<ClassTemplateItem>(name, prefix, isLocal, isCompletedDecl, decl); });
}

void Collection::addClassTemplateSpecialization(const std::string& name,
                                                const std::string& prefix,
                                                bool isLocal,
                                                bool isCompletedDecl,
                                                const clang::ClassTemplateSpecializationDecl* decl)
{
    addItem(
        name,
        prefix,
        [name, prefix, isLocal, isCompletedDecl, decl]()
        { return AbstractItem::make<ClassTemplateSpecializationItem>(name, prefix, isLocal, isCompletedDecl, decl); });
}

void Collection::addEnum(
    const std::string& name, const std::string& prefix, bool isLocal, bool isCompletedDecl, const clang::EnumDecl* decl)
{

    addItem(name,
            prefix,
            [name, prefix, isLocal, isCompletedDecl, decl]()
            { return AbstractItem::make<EnumItem>(name, prefix, isLocal, isCompletedDecl, decl); });
}

void Collection::addFunction(const std::string& name,
                             const std::string& prefix,
                             bool isLocal,
                             bool isCompletedDecl,
                             const clang::FunctionDecl* decl)
{
    // get first declaration of function
    if (decl->isFirstDecl())
    {
        container_item_t parent = getContainerItem(prefix);
        auto item = AbstractItem::make<FunctionItem>(name, prefix, isLocal, true, decl);
        parent->addItem(item);
    }
}

void Collection::addFunctionTemplate(const std::string& name,
                                     const std::string& prefix,
                                     bool isLocal,
                                     bool isCompletedDecl,
                                     const clang::FunctionTemplateDecl* decl)
{
    // get first declaration of function
    if (decl->isFirstDecl())
    {
        container_item_t parent = getContainerItem(prefix);
        auto item = AbstractItem::make<FunctionTemplateItem>(name, prefix, isLocal, true, decl);
        parent->addItem(item);
    }
}

void Collection::addVariable(
    const std::string& name, const std::string& prefix, bool isLocal, bool isCompletedDecl, const clang::VarDecl* decl)
{
    addItem(name,
            prefix,
            [name, prefix, isLocal, isCompletedDecl, decl]()
            { return AbstractItem::make<VariableItem>(name, prefix, isLocal, isCompletedDecl, decl); });
}

// TODO extract this to separate new class CollectionPriter
void Collection::print(const std::string& filename, bool usePadding) const
{
    struct Row
    {
        std::string prefix;
        std::string name;
        std::string type;
    };

    std::vector<Row> rows;

    std::ofstream ofs{filename, std::ofstream::out};

    ofs << "# Collection of records: Item.prefix() | Item.name() | Item.type()";

    Collection::ref().visit(
        [&rows](const_abstract_item_t item) {
            rows.push_back({item->prefix(), item->name(), typeToString(item->type())});
        });

    auto prefix_max_size =
        std::max_element(
            rows.begin(), rows.end(), [](const auto& a, const auto& b) { return a.prefix.size() < b.prefix.size(); })
            ->prefix.size();

    auto name_max_size = std::max_element(rows.begin(),
                                          rows.end(),
                                          [](const auto& a, const auto& b) { return a.name.size() < b.name.size(); })
                             ->name.size();

    auto type_max_size = std::max_element(rows.begin(),
                                          rows.end(),
                                          [](const auto& a, const auto& b) { return a.type.size() < b.type.size(); })
                             ->type.size();

    for (const auto& it : rows)
    {
        if (usePadding)
        {
            ofs.width(prefix_max_size + 3);
        }
        ofs << it.prefix << " | ";
        if (usePadding)
        {
            ofs.width(name_max_size + 3);
        }
        ofs << it.name << " | ";
        if (usePadding)
        {
            ofs.width(type_max_size);
        }
        ofs << it.type << "\n";
    }
}

} //  namespace parser
