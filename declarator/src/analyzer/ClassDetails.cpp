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

#include "generator/AbstractBlock.h"
#include "generator/FileBlock.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/PrettyPrinter.h>

#include <optional>
#include <regex>
#include <string>
#include <vector>

namespace
{

std::string getFullName(const std::string& name, const std::string& prefix)
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

std::vector<parser::const_class_item_t> getNotExportedBases(parser::const_class_item_t item,
                                                            const parser::Collection& collection)
{
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

                if (!annotations.exist("TS_EXPORT"))
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

    auto node = InheritanceNode::make(Collection::get(), item);

    Collector collector;
    collector.collect(node);
    return collector.get();
}

generator::ts::block_t<generator::ts::MethodBlock> makeMethod(parser::const_class_item_t classItem,
                                                              const parser::MethodItem& item,
                                                              const analyzer::TypeMapper& typeMapper)
{
    using namespace parser;
    using namespace analyzer;
    using namespace generator::ts;

    block_t<MethodBlock> method;

    AnnotationList annotations(getAnnotations(item.decl()));

    if (annotations.exist("TS_METHOD"))
    {
        if (annotations.exist("TS_SIGNATURE"))
        {
            TsMethod signature(annotations.values("TS_SIGNATURE").at(0));

            method = AbstractBlock::make<MethodBlock>(signature.name(), signature.retType(), false);

            for (const auto& it : signature.arguments())
            {
                method->addArgument(it.name, it.type, it.isSpread);
            }
        }
        else
        {
            std::string name = annotations.exist("TS_NAME") ? annotations.values("TS_NAME").at(0) : item.name();

            std::string retType = annotations.exist("TS_RETURN_TYPE")
                                      ? annotations.values("TS_RETURN_TYPE").at(0)
                                      : collapseType(classItem->prefix(), mapType(typeMapper, item.returnType()));

            method = (item.isConstructor()) ? AbstractBlock::make<MethodBlock>()
                                            : AbstractBlock::make<MethodBlock>(name, retType, item.isStatic());

            if (annotations.exist("TS_GETTER"))
            {
                method->setAccessor("get");
            }
            else if (annotations.exist("TS_SETTER"))
            {
                method->setAccessor("set");
            }

            for (const auto& it : item.parameters())
            {
                method->addArgument(
                    it.name(), collapseType(classItem->prefix(), mapType(typeMapper, it.type())), false);
            }
        }

        if (annotations.exist("TS_DECORATOR"))
        {
            for (const auto& it : annotations.values("TS_DECORATOR"))
            {
                decorator_t decorator = Decorator::fromString(it);
                method->addDecorator(decorator);
            }
        }

        if (annotations.exist("TS_IGNORE"))
        {
            method->setIgnore();
        }
    }

    return method;
}

generator::ts::block_t<generator::ts::FieldBlock> makeField(parser::const_class_item_t classItem,
                                                            const parser::FieldItem& item,
                                                            const analyzer::TypeMapper& typeMapper)
{
    using namespace parser;
    using namespace analyzer;
    using namespace generator::ts;

    block_t<FieldBlock> result;

    auto isTemplateType = [](const parser::FieldItem& item, parser::const_class_item_t classItem)
    {
        bool result = false;
        auto templateClassItem = std::dynamic_pointer_cast<const ClassTemplateItem>(classItem);

        if (templateClassItem)
        {
            std::string type = item.type().getAsString();

            for (const auto& it : templateClassItem->templateParameters())
            {
                if (type == it.name())
                {
                    result = true;
                    break;
                }
            }
        }

        return result;
    };

    if (isTemplateType(item, classItem))
    {
        // don't map template type
        result = AbstractBlock::make<FieldBlock>(item.name(), "pointer", true);
    }
    else
    {
        result = AbstractBlock::make<FieldBlock>(item.name(), mapType(typeMapper, item.type()), true);
    }

    return result;
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
        std::string actualTypeName = getType(it);
        bool instantiated = true;

        auto base_item = getItem(m_collection, actualTypeName);

        if (!base_item)
        {
            // MyClass<T> -> MyClass
            base_item = getItem(m_collection, getTemplateName(actualTypeName));

            _ASSERT((*base_item)->type() == AbstractItem::CLASS_TEMPLATE);

            instantiated = false;
        }

        if (base_item)
        {
            const_class_item_t baseClassItem = std::static_pointer_cast<const ClassItem>(*base_item);

            m_bases.push_back(InheritanceNode{m_collection, baseClassItem, getPartName(actualTypeName), instantiated});
        }
    }
}

std::optional<parser::const_abstract_item_t> InheritanceNode::getItem(const parser::Collection& collection,
                                                                      const std::string& path)
{
    std::optional<parser::const_abstract_item_t> result;

    try
    {
        result = collection.getItem(path);
    }
    catch (std::exception&)
    {
        // result remains empty
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
    return m_bases;
}

//-------------------

std::string getExtends(parser::const_class_item_t item)
{
    using namespace utils;
    using namespace parser;

    class Collector
    {
        std::vector<std::string> m_list;

    public:
        void collect(const InheritanceNode& node)
        {
            for (const auto& it : node.bases())
            {
                AnnotationList annotations(getAnnotations(it.item()->decl()));

                // collect all annotated classes
                if (annotations.exist("TS_EXPORT"))
                {
                    m_list.push_back(it.actualTypeName());
                }
                else
                {
                    collect(it);
                }
            }
        }

        std::vector<std::string> get() const
        {
            return m_list;
        }
    };

    auto node = InheritanceNode::make(Collection::get(), item);

    Collector collector;
    collector.collect(node);

    std::vector<std::string> bases = collector.get();

    // no more than one annotated class in a hierarchy of inheritance
    if (bases.size() > 1)
    {
        throw Exception(R"(Multiple inheritance is not supported in TypeScript: class "%s", bases: [%s])",
                        item->name().c_str(),
                        join(bases).c_str());
    }

    return !bases.empty() ? bases.at(0) : "";
}

std::vector<generator::ts::field_block_t> getFields(parser::const_class_item_t item,
                                                    const analyzer::TypeMapper& typeMapper,
                                                    const parser::Collection& collection)
{
    using namespace generator::ts;
    using namespace utils;
    using namespace parser;

    class Collector
    {
    private:
        const analyzer::TypeMapper& m_typeMapper;
        std::vector<field_block_t> m_fieldList;

    private:
        void extract(const InheritanceNode& node)
        {
            extract(node.item());
        }

        void extract(parser::const_class_item_t item)
        {
            std::vector<FieldItem> fields = item->fields();

            for (const auto& field : fields)
            {
                m_fieldList.push_back(makeField(item, field, m_typeMapper));
            }
        }

        void collect_bases(const InheritanceNode& node)
        {
            for (const auto& it : node.bases())
            {
                AnnotationList annotations(getAnnotations(it.item()->decl()));

                if (!annotations.exist("TS_EXPORT"))
                {
                    extract(it);
                    collect_bases(it);
                }
            }
        }

    public:
        Collector(const analyzer::TypeMapper& typeMapper)
            : m_typeMapper(typeMapper)
        {
        }

        void collect(const InheritanceNode& node)
        {
            extract(node.item());
            collect_bases(node);
        }
    
        std::vector<field_block_t> get() const
        {
            return m_fieldList;
        }
    };

    auto node = InheritanceNode::make(Collection::get(), item);

    Collector collector(typeMapper);
    collector.collect(node);

    return collector.get();
}

std::vector<generator::ts::field_block_t> getFillerFields(parser::const_class_item_t item)
{
    using namespace generator::ts;
    using namespace utils;
    using namespace parser;

    std::vector<field_block_t> result;

    auto divider = [](int size, int& reminder, int d) -> int
    {
        reminder = size % d;
        return size / d;
    };

    int basesSize = 0;

    auto node = InheritanceNode::make(Collection::get(), item);

    // find size of bases (annotated) classes
    for (const auto& it : node.bases())
    {
        AnnotationList annotations(getAnnotations(it.item()->decl()));

        if (annotations.exist("TS_EXPORT"))
        {
            basesSize += it.item()->size();
        }
    }

    int size = item->size() - basesSize;

    _ASSERT(size >= 0);

    const std::vector<std::pair<std::string, int>> denominators = {
        {"uint64_t", sizeof(uint64_t)},
        {"uint32_t", sizeof(uint32_t)},
        {"uint16_t", sizeof(uint16_t)},
        {"uint8_t", sizeof(uint8_t)},
    };

    int n = 0;
    for (const auto& it : denominators)
    {
        int remander = 0;
        int N = divider(size, remander, it.second);

        for (auto i = 0; i < N; i++)
        {
            std::string name = strprintf("p%d_%s", n, item->name().c_str());
            result.push_back(AbstractBlock::make<FieldBlock>(name, it.first, true));

            ++n;
        }

        size -= N * it.second;
    }

    return result;
}

std::vector<generator::ts::method_block_t> getMethods(parser::const_class_item_t item,
                                                      const analyzer::TypeMapper& typeMapper,
                                                      const parser::Collection& collection)
{
    using namespace parser;
    using namespace generator::ts;

    std::vector<method_block_t> result;

    auto extract = [&typeMapper, &result](parser::const_class_item_t item)
    {
        for (const auto& it : item->methods())
        {
            auto method = makeMethod(item, it, typeMapper);

            if (method)
            {
                result.push_back(method);
            }
        }
    };

    extract(item);

    for (const auto& it : getNotExportedBases(item, collection))
    {
        extract(it);
    }

    return result;
}

std::vector<generator::ts::method_block_t> getClosures(parser::const_class_item_t item,
                                                       const analyzer::TypeMapper& typeMapper,
                                                       const parser::Collection& collection)
{
    using namespace parser;
    using namespace generator::ts;
    using namespace utils;

    std::vector<method_block_t> result;

    auto extract = [&typeMapper, &result](parser::const_class_item_t item)
    {
        for (const auto& it : item->methods())
        {
            AnnotationList annotations(getAnnotations(it.decl()));

            if (annotations.exist("TS_CLOSURE"))
            {
                block_t<MethodBlock> method;

                _ASSERT(!it.isConstructor());

                method = AbstractBlock::make<MethodBlock>(
                    it.name(), collapseType(item->prefix(), mapType(typeMapper, it.returnType())), false);

                result.push_back(method);

                for (const auto& it : it.parameters())
                {
                    method->addArgument(it.name(), "TSClosure", false);
                }
            }
        }
    };

    extract(item);

    for (const auto& it : getNotExportedBases(item, collection))
    {
        extract(it);
    }

    return result;
}

std::vector<generator::ts::method_block_t> getTemplateMethods(parser::const_class_template_item_t item,
                                                              const analyzer::TypeMapper& typeMapper,
                                                              const parser::Collection& collection)
{
    using namespace parser;
    using namespace generator::ts;

    std::vector<method_block_t> result;

    for (const auto& it : item->templateMethods())
    {
        auto method = makeMethod(item, it, typeMapper);

        if (method)
        {
            result.push_back(method);
        }
    }

    return result;
}

} // namespace analyzer
