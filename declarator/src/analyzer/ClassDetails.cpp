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

#include "ClassDetails.h"
#include "TsUtils.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"
#include "parser/NamespaceItem.h"

#include "global/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/PrettyPrinter.h>

#include <iterator>
#include <map>
#include <regex>
#include <set>

namespace
{

std::string getFullName(const std::string& prefix, const std::string& name)
{
    return !prefix.empty() ? prefix + "::" + name : name;
}

std::string getPartName(const std::string& path)
{
    std::string result = path;
    std::regex regexp(R"(([a-zA-Z\:\<\>]*)::([a-zA-Z\:\<\>]*))");
    std::smatch match;

    if (std::regex_search(path.begin(), path.end(), match, regexp))
    {
        result = match[2];
    }

    return result;
}

class MethodOverloads
{
private:
    template <typename T>
    static std::map<std::string, int> frequencyMap(T&& container)
    {
        std::map<std::string, int> result;

        for (const auto& it : container)
        {
            std::string name = it->name();

            if (result.find(name) == result.end())
            {
                result[name] = 1;
            }
            else
            {
                ++result[name];
            }
        }

        return result;
    }

    template <typename T>
    static bool is_accessors(const T& container, const std::string& name)
    {
        T methods;
        std::set<std::string> values;
        std::copy_if(std::begin(container),
                     std::end(container),
                     std::back_inserter(methods),
                     [name](auto item) { return item->name() == name; });

        _ASSERT(methods.size() == 2);

        for (const auto& it : methods)
        {
            values.insert(it->accessor());
        }

        return values.find("set") != values.end() && values.find("get") != values.end();
    }

public:
    template <typename T>
    static std::vector<std::string> get(T&& container)
    {
        std::vector<std::string> result;

        for (const auto& it : frequencyMap<T>(container))
        {
            // getter and setter
            if (it.second == 2)
            {
                if (is_accessors(container, it.first))
                    continue;
            }

            if (it.second > 1)
            {
                result.push_back(it.first);
            }
        }

        return result;
    }
};

template <typename T>
void pushBlock(typename std::vector<T>& container, T block)
{
    auto pred = [block](const T& it)
    {
        bool result = false;
        if (it->name() == block->name())
        {
            if (block->accessor() == it->accessor())
            {
                result = true;
            }
        }

        return result;
    };

    auto found = std::find_if(container.begin(), container.end(), pred);

    if (found != container.end())
    {
        // replace method block if already exist
        // for example: virtual methods from base class and overridden methods in derived class
        // overridden methods have more priority
        *found = block;
    }
    else
    {
        // add new
        container.push_back(block);
    }
}

template <>
void pushBlock(typename std::vector<generator::ts::operator_block_t>& container, generator::ts::operator_block_t block)
{
    container.push_back(block);
}

} // namespace

namespace analyzer
{

InheritanceNode::InheritanceNode(const parser::Collection& collection,
                                 parser::const_class_item_t item,
                                 const std::string& actualTypeName,
                                 bool instantiated)
    : m_collection(collection)
    , m_item(item)
    , m_actualTypeName(actualTypeName)
    , m_instantiated(instantiated)
{
    using namespace parser;

    for (const auto& it : getBases(item->decl()))
    {
        std::string currentActualTypeName = getType(it);
        bool instantiated = true;

        auto base_item = getItem(m_collection, currentActualTypeName);

        if (!base_item)
        {
            // MyClass<T> -> MyClass
            base_item = getItem(m_collection, getTemplateName(currentActualTypeName));

            _ASSERT((*base_item)->type() == AbstractItem::CLASS_TEMPLATE);

            instantiated = false;
        }

        if (base_item)
        {
            const_class_item_t baseClassItem = std::static_pointer_cast<const ClassItem>(*base_item);

            m_bases.push_back(
                InheritanceNode{m_collection, baseClassItem, getPartName(currentActualTypeName), instantiated});
        }
    }
}

InheritanceNode::InheritanceNode(const InheritanceNode& other)
    : m_collection(other.m_collection)
    , m_item(other.m_item)
    , m_actualTypeName(other.m_actualTypeName)
    , m_bases(other.m_bases.begin(), other.m_bases.end())
    , m_instantiated(other.m_instantiated)
{
}

InheritanceNode& InheritanceNode::operator=(const InheritanceNode& other)
{
    if (&other != this)
    {
        m_item = other.m_item;
        m_actualTypeName = other.m_actualTypeName;
        m_bases.assign(other.m_bases.begin(), other.m_bases.end());
        m_instantiated = other.m_instantiated;
    }

    return *this;
}

std::optional<parser::const_abstract_item_t> InheritanceNode::getItem(const parser::Collection& collection,
                                                                      const std::string& path)
{
    std::optional<parser::const_abstract_item_t> result;
    parser::const_item_list_t items;

    try
    {
        items = collection.getItems(path);
    }
    catch (std::exception&)
    {
        // result remains empty
    }

    if (!items.empty())
    {
        _ASSERT(items.size() == 1);
        result = items.at(0);
    }

    return result;
}

std::string InheritanceNode::getType(const clang::CXXBaseSpecifier& it)
{
    clang::LangOptions lo;
    clang::PrintingPolicy pp(lo);
    pp.adjustForCPlusPlus();

    std::string type = it.getTypeSourceInfo()->getType().getAsString(pp);
    return type;
}

std::vector<clang::CXXBaseSpecifier> InheritanceNode::getBases(const clang::CXXRecordDecl* decl)
{
    std::vector<clang::CXXBaseSpecifier> result;

    if (decl && decl->hasDefinition())
    {
        auto bases = decl->bases();

        for (const auto& it : bases)
        {
            result.push_back(it);
        }
    }

    return result;
}

std::string InheritanceNode::getTemplateName(const std::string& actualTypeName) const
{
    std::string result;
    std::regex regexp(R"((\w*)(\<(.*)\>)?)");

    std::smatch match;

    if (!std::regex_search(actualTypeName.begin(), actualTypeName.end(), match, regexp))
    {
        throw utils::Exception(R"(invalid class template instantiation signature: "%s")", actualTypeName.c_str());
    }

    result = match[1];

    return result;
}

InheritanceNode InheritanceNode::make(const parser::Collection& collection, parser::const_class_item_t item)
{
    InheritanceNode node(collection, item, item->name());

    return node;
}

parser::const_class_item_t InheritanceNode::item() const
{
    return m_item;
}

std::string InheritanceNode::actualTypeName() const
{
    return m_actualTypeName;
}

std::vector<InheritanceNode> InheritanceNode::bases() const
{
    std::vector<InheritanceNode> result(m_bases.begin(), m_bases.end());
    std::reverse(result.begin(), result.end());
    return result;
}

ClassCollection::ClassCollection(parser::const_class_item_t item,
                                 const parser::Collection& collection,
                                 const TypeMapper& typeMapper)
    : m_item(item)
    , m_collection(collection)
    , m_typeMapper(typeMapper)
{
}

std::vector<parser::const_class_item_t> ClassCollection::getBases() const
{
    using namespace global::annotations;
    using namespace parser;
    using namespace analyzer;

    class Collector
    {
        std::vector<const_class_item_t> m_list;

    public:
        void collect(const InheritanceNode& node)
        {
            for (const auto& it : node.bases())
            {
                AnnotationList annotations(getAnnotations(it.item()->decl()));

                if (!annotations.exist(TS_EXPORT))
                {
                    m_list.push_back(it.item());

                    collect(it);
                }
            }
        }

        std::vector<const_class_item_t> get() const
        {
            return m_list;
        }
    };

    auto node = InheritanceNode::make(m_collection, m_item);

    Collector collector;
    collector.collect(node);
    return collector.get();
}

generator::ts::abstract_method_block_t ClassCollection::makeMethod(const parser::MethodItem& item,
                                                                   const std::string& className,
                                                                   const std::string& classPrefix)
{
    using namespace global::annotations;
    using namespace parser;
    using namespace analyzer;
    using namespace generator::ts;

    abstract_method_block_t result;

    AnnotationList annotations(getAnnotations(item.decl()));

#ifndef NDEBUG
    std::string methodName = item.name();
#endif

    if (annotations.exist(TS_METHOD))
    {
        if (annotations.exist(TS_SIGNATURE))
        {
            TsSignature signature(annotations.values(TS_SIGNATURE).at(0));

            switch (signature.type())
            {
                case TsSignature::Type::METHOD:
                {
                    auto block =
                        (item.isConstructor())
                            ? AbstractBlock::make<MethodBlock>()
                            : AbstractBlock::make<MethodBlock>(signature.name(), signature.retType(), item.isStatic());

                    for (const auto& it : signature.arguments())
                    {
                        block->addArgument({it.name, it.type, it.isSpread, it.isOptional});
                    }

                    result = block;

                    break;
                }
                case TsSignature::Type::GENERIC_METHOD:
                {
                    auto block = (item.isConstructor()) ? AbstractBlock::make<GenericMethodBlock>()
                                                        : AbstractBlock::make<GenericMethodBlock>(
                                                              signature.name(), signature.retType(), item.isStatic());

                    for (const auto& it : signature.arguments())
                    {
                        block->addArgument({it.name, it.type, it.isSpread, it.isOptional});
                    }

                    for (const auto& it : signature.templateArguments())
                    {
                        block->addTemplateArgument(it);
                    }

                    result = block;

                    break;
                }
                case TsSignature::Type::COMPUTED_PROPERTY_NAME:
                {
                    auto block = AbstractBlock::make<ComputedPropertyNameBlock>(signature.name(), signature.retType());
                    result = block;
                    break;
                }
                case TsSignature::Type::INDEX_SIGNATURE:
                {
                    _ASSERT(signature.arguments().size() == 1);
                    auto arg = signature.arguments().at(0);
                    std::string retType = signature.retType();

                    auto block = AbstractBlock::make<IndexSignatureBlock>(retType);
                    block->setArgument({arg.name, arg.type});
                    result = block;
                    break;
                }
                default:
                {
                    throw utils::Exception(
                        R"(incorrect signature type: available types: 
                        [METHOD, GENERIC_METHOD, COMPUTED_PROPERTY_NAME, INDEX_SIGNATURE];
                        Method: "%s", scope: "%s", class: "%s", signature: "%s")",
                        item.name().c_str(),
                        className.c_str(),
                        classPrefix.c_str(),
                        annotations.values(TS_SIGNATURE).at(0).c_str());
                }
            };
        }
        else
        {
            std::string name = annotations.exist(TS_NAME) ? annotations.values(TS_NAME).at(0) : item.name();

            std::string retType = annotations.exist(TS_RETURN_TYPE)
                                      ? annotations.values(TS_RETURN_TYPE).at(0)
                                      : collapseType(classPrefix, mapType(m_typeMapper, item.returnType()));

            auto block = (item.isConstructor()) ? AbstractBlock::make<MethodBlock>()
                                                : AbstractBlock::make<MethodBlock>(name, retType, item.isStatic());

            if (annotations.exist(TS_GETTER))
            {
                block->setAccessor("get");
            }
            else if (annotations.exist(TS_SETTER))
            {
                block->setAccessor("set");
            }

            for (const auto& it : item.parameters())
            {
                block->addArgument({it.name(), collapseType(classPrefix, mapType(m_typeMapper, it.type()))});
            }

            result = block;
        }

        if (annotations.exist(TS_DECORATOR))
        {
            for (const auto& it : annotations.values(TS_DECORATOR))
            {
                decorator_t decorator = Decorator::fromString(it);
                result->addDecorator(decorator);
            }
        }

        if (annotations.exist(TS_IGNORE))
        {
            result->setIgnore();
        }
    }
    else if (annotations.exist(TS_CLOSURE))
    {
        std::string name = annotations.exist(TS_NAME) ? annotations.values(TS_NAME).at(0) : item.name();

        auto block = AbstractBlock::make<ClosureBlock>(name);

        for (const auto& it : item.parameters())
        {
            block->addArgument({it.name(), "TSClosure"});
        }

        result = block;
    }

    return result;
}

void ClassCollection::extract()
{
    // items from base classes first
    for (const auto& it : getBases())
    {
        extract(it);
    }

    // own items next
    extract(m_item);
}

void ClassCollection::extract(parser::const_class_item_t item)
{
    for (const auto& it : item->methods())
    {
        collect(it);
    }

    for (const auto& it : item->templateMethods())
    {
        collect(it);
    }
}

void ClassCollection::collect(const parser::MethodItem& item)
{
    using namespace generator::ts;

    auto abstractMethodBlock = makeMethod(item, m_item->name(), m_item->prefix());

    if (abstractMethodBlock)
    {
        switch (abstractMethodBlock->type())
        {
            case AbstractBlock::Type::METHOD:
            {
                auto methodBlock = std::static_pointer_cast<MethodBlock>(abstractMethodBlock);
                pushBlock(methods, methodBlock);
                break;
            }
            case AbstractBlock::Type::GENERIC_METHOD:
            {
                auto genericMethodBlock = std::static_pointer_cast<GenericMethodBlock>(abstractMethodBlock);
                pushBlock(generic_methods, genericMethodBlock);
                break;
            }
            case AbstractBlock::Type::CLOSURE:
            {
                auto closureBlock = std::static_pointer_cast<ClosureBlock>(abstractMethodBlock);
                pushBlock(closures, closureBlock);
                break;
            }
            case AbstractBlock::Type::COMPUTED_PROPERTY_NAME:
            case AbstractBlock::Type::INDEX_SIGNATURE:
            {
                auto operatorBlock = std::static_pointer_cast<OperatorBlock>(abstractMethodBlock);
                pushBlock(operators, operatorBlock);
                break;
            }
            default:
            {
                throw utils::Exception(R"(unsupported block type: name "%s", type: "%s")",
                                       abstractMethodBlock->name().c_str(),
                                       typeToString(abstractMethodBlock->type()).c_str());
            }
        };
    }
}

void ClassCollection::generateFields()
{
    using namespace global::annotations;
    using namespace generator::ts;
    using namespace utils;
    using namespace parser;

    auto divider = [](int size, int& reminder, int d) -> int
    {
        reminder = size % d;
        return size / d;
    };

    int basesSize = 0;

    auto node = InheritanceNode::make(m_collection, m_item);

    // find size of bases (annotated) classes
    for (const auto& it : node.bases())
    {
#ifndef NDEBUG
        std::string name = it.actualTypeName();
#endif

        AnnotationList annotations(getAnnotations(it.item()->decl()));

        if (annotations.exist(TS_EXPORT))
        {
            basesSize += it.item()->size();
        }
    }

    int size = m_item->size() - basesSize;

    _ASSERT(size >= 0);

    const std::vector<std::pair<std::string, int>> denominators = {{"number", sizeof(double)},
                                                                   {"boolean", sizeof(bool)}};

    int n = 0;
    for (const auto& it : denominators)
    {
        int reminder = 0;
        int N = divider(size, reminder, it.second);

        for (auto i = 0; i < N; i++)
        {
            std::string name = strprintf("p%d_%s", n, m_item->name().c_str());
            fields.push_back(AbstractBlock::make<FieldBlock>(name, it.first, true));

            ++n;
        }

        size -= N * it.second;
    }
}

ClassCollection ClassCollection::make(parser::const_class_item_t item,
                                      const parser::Collection& collection,
                                      const TypeMapper& typeMapper)
{
    ClassCollection result(item, collection, typeMapper);
    result.extract();
    result.generateFields();
    result.check();

    return result;
}

void ClassCollection::check() const
{
    using namespace utils;

    std::vector<std::string> method_overloads = MethodOverloads::get(methods);
    std::vector<std::string> generic_method_overloads = MethodOverloads::get(generic_methods);
    std::vector<std::string> closures_overloads = MethodOverloads::get(closures);

    if (!method_overloads.empty())
    {
        throw Exception(R"(overloaded methods detected: "%s",  class: "%s", scope: "%s")",
                        join(method_overloads).c_str(),
                        m_item->name().c_str(),
                        m_item->prefix().c_str());
    }

    if (!generic_method_overloads.empty())
    {
        throw Exception(R"(overloaded generic methods detected: "%s",  class: "%s", scope: "%s")",
                        join(generic_method_overloads).c_str(),
                        m_item->name().c_str(),
                        m_item->prefix().c_str());
    }

    if (!closures_overloads.empty())
    {
        throw Exception(R"(overloaded closures detected: "%s",  class: "%s", scope: "%s")",
                        join(closures_overloads).c_str(),
                        m_item->name().c_str(),
                        m_item->prefix().c_str());
    }
}

std::vector<std::string> Extends::exportedBases(parser::const_class_item_t item)
{
    using namespace global::annotations;
    using namespace utils;
    using namespace parser;

    std::vector<std::string> result;

    std::function<void(const InheritanceNode&)> collect;

    collect = [&collect, &result](const InheritanceNode& node)
    {
        for (const auto& it : node.bases())
        {
            AnnotationList annotations(getAnnotations(it.item()->decl()));

            // collect all annotated classes
            if (annotations.exist(TS_EXPORT))
            {
                result.push_back(getFullName(it.item()->prefix(), it.actualTypeName()));
            }
            else
            {
                collect(it);
            }
        }
    };

    auto node = InheritanceNode::make(Collection::get(), item);

    collect(node);

    return result;
}

bool Extends::getModuleName(const std::string& path, std::string& moduleName)
{
    using namespace global::annotations;
    using namespace utils;
    using namespace parser;

    bool result = false;

    std::vector<std::string> parts = split(path, "::");

    if (!parts.empty())
    {
        moduleName = parts.at(0);

        auto& collection = Collection::get();

        if (collection.existItem("", moduleName))
        {
            item_list_t items = collection.getItems(moduleName);
            _ASSERT(items.size() == 1);

            abstract_item_t item = items.at(0);

            if (item->type() == AbstractItem::Type::NAMESPACE)
            {
                namespace_item_t namespaceItem = std::static_pointer_cast<NamespaceItem>(item);
                AnnotationList annotations(getAnnotations(namespaceItem->decl()));

                if (annotations.exist(TS_MODULE))
                {
                    result = true;
                }
            }
        }
    }

    return result;
}

bool Extends::isTheSameModule(const std::string& path1, const std::string& path2)
{
    std::string moduleName1, moduleName2;
    return getModuleName(path1, moduleName1) && getModuleName(path2, moduleName2) && moduleName1 == moduleName2;
}

std::string Extends::normalize(const std::string& expr)
{
    using namespace utils;

    auto isTemplate = [](const std::string& expr) -> bool
    {
        std::regex regexp(R"(([\w]*)\<(.+)\>)");
        return std::regex_match(expr, regexp);
    };

    auto parse = [](const std::string& expr, std::string& name, std::vector<std::string>& args)
    {
        using namespace utils;

        std::regex regexp(R"(([\w]*)\<(.+)\>)"); // example: Tuple<K, V>
        std::smatch match;

        if (!std::regex_search(expr.begin(), expr.end(), match, regexp))
        {
            throw Exception(R"(invalid template signature: "%s")", expr.c_str());
        }

        name = match[1];
        std::string sArgs = match[2];

        regexp = R"((([\w]+)\<(.+)\>)|([\w]+))"; // example: K, V
        auto _begin = std::sregex_iterator(sArgs.begin(), sArgs.end(), regexp);
        auto _end = std::sregex_iterator();

        for (auto it = _begin; it != _end; ++it)
        {
            std::string arg = (*it).str();
            args.push_back(arg);
        }
    };

    std::string result = expr;

    if (isTemplate(expr))
    {
        std::string name;
        std::vector<std::string> argsList;
        parse(expr, name, argsList);

        for (auto& it : argsList)
        {
            it = normalize(it);
        }

        std::string args = join(argsList, ", ");
        result = strprintf(R"(%s<%s>)", name.c_str(), args.c_str());
    }

    return result;
}

std::string Extends::get(parser::const_class_item_t item)
{
    using namespace utils;

    std::string result;

    std::vector<std::string> bases = exportedBases(item);

    // no more than one annotated class in a hierarchy of inheritance
    if (bases.size() > 1)
    {
        throw Exception(R"(Multiple inheritance is not supported in TypeScript: class "%s", bases: [%s])",
                        item->name().c_str(),
                        join(bases).c_str());
    }

    if (bases.empty())
    {
        return result;
    }
    else
    {
        std::string extends = bases.at(0);

        extends = normalize(extends);

        if (isTheSameModule(extends, item->prefix()))
        {
            result = collapseType(item->prefix(), extends);
        }
        else
        {
            std::vector<std::string> parts = split(extends, "::");

            std::string moduleName;
            if (getModuleName(extends, moduleName))
            {
                _ASSERT(parts.at(0) == moduleName);

                // remove module name from path
                parts.erase(parts.begin());
            }

            result = join(parts, ".");
        }
    }

    return result;
}

} // namespace analyzer
