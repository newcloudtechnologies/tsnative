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
#include "generator/ElementAccessExpressionBlock.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/PrettyPrinter.h>

#include <optional>
#include <string>
#include <vector>

namespace
{

std::string getFullName(const std::string& name, const std::string& prefix)
{
    return !prefix.empty() ? prefix + "::" + name : name;
}

std::optional<parser::const_abstract_item_t> getItem(const parser::Collection& collection, const std::string& path)
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

void getAllBasesImpl(std::vector<analyzer::ClassBases>& list,
                     const parser::const_class_item_t item,
                     const parser::Collection& collection)
{
    using namespace parser;

    auto getBases = [](const clang::CXXRecordDecl* decl)
    {
        clang::LangOptions lo;
        clang::PrintingPolicy pp(lo);
        pp.adjustForCPlusPlus();

        std::vector<std::string> result;

        if (decl && decl->hasDefinition())
        {
            auto bases = decl->bases();

            for (const auto& it : bases)
            {
                std::string type = it.getType().getCanonicalType().getAsString(pp);
                result.push_back(type);
            }
        }

        return result;
    };

    std::vector<const_class_item_t> bases;

    for (const auto& it : getBases(item->decl()))
    {
        auto base_item = getItem(collection, it);

        if (base_item)
        {
            const_class_item_t item = std::static_pointer_cast<const ClassItem>(*base_item);
            bases.push_back(item);
        }
    }

    list.push_back({item->name(), item->prefix(), bases});

    for (const auto& it : bases)
    {
        if (it)
        {
            getAllBasesImpl(list, it, collection);
        }
    }
}

std::vector<parser::const_class_item_t> getNotExportedBases(parser::const_class_item_t item,
                                                            const parser::Collection& collection)
{
    using namespace parser;
    using namespace analyzer;
    using namespace generator::ts;

    std::vector<const_class_item_t> result;

    auto bases = getAllBases(item, collection);

    // iterate all base classes without TS_EXPORT and extract methods with TS_METHOD annotation
    for (const auto& [name, prefix, _1] : bases)
    {
        if (!(item->name() == name && item->prefix() == prefix))
        {
            auto base_item = getItem(collection, getFullName(name, prefix));

            if (base_item)
            {
                const_class_item_t baseClass = std::static_pointer_cast<const ClassItem>(*base_item);

                AnnotationList annotations(getAnnotations(baseClass->decl()));

                if (!annotations.exist("TS_EXPORT"))
                {
                    result.push_back(baseClass);
                }
            }
        }
    }

    return result;
}

generator::ts::block_t<generator::ts::MethodBlock> makeMethod(parser::const_class_item_t item,
                                                              const parser::MethodItem& it,
                                                              const analyzer::TypeMapper& typeMapper,
                                                              const parser::AnnotationList& annotations)
{
    using namespace parser;
    using namespace analyzer;
    using namespace generator::ts;

    block_t<MethodBlock> method;

    if (annotations.exist("TS_METHOD"))
    {
        if (annotations.exist("TS_SIGNATURE"))
        {
            TsMethod signature(annotations.value("TS_SIGNATURE"));

            method = AbstractBlock::make<MethodBlock>(signature.name(), signature.retType(), false);

            for (const auto& it : signature.arguments())
            {
                method->addArgument(it.name, it.type, it.isSpread);
            }
        }
        else
        {
            std::string name = annotations.exist("TS_NAME") ? annotations.value("TS_NAME") : it.name();

            std::string retType = annotations.exist("TS_RETURN_TYPE")
                                      ? annotations.value("TS_RETURN_TYPE")
                                      : collapseType(item->prefix(), mapType(typeMapper, it.returnType()));

            // TODO: add other operators
            if (name == "operator[]")
            {
                method = AbstractBlock::make<ElementAccessExpressionBlock>(retType, it.isStatic());
            }
            else
            {
                method = (it.isConstructor()) ? AbstractBlock::make<MethodBlock>()
                                              : AbstractBlock::make<MethodBlock>(name, retType, it.isStatic());

                if (annotations.exist("TS_GETTER"))
                {
                    method->setAccessor("get");
                }
                else if (annotations.exist("TS_SETTER"))
                {
                    method->setAccessor("set");
                }
            }

            for (const auto& it : it.parameters())
            {
                method->addArgument(it.name(), collapseType(item->prefix(), mapType(typeMapper, it.type())), false);
            }
        }
    }

    return method;
}

} // namespace

namespace analyzer
{

/*
Example:

Event <- CustomEvent

<CustomEvent>:

[0]:
[name] CustomEvent
[prefix] mgt::ts
[items] {Event} (one base class)

[1]:
[name] Event
[prefix] mgt::ts
[items] {} (no any base classes)

<Event>:

[0]:
[name] Event
[prefix] mgt::ts
[items] {} (no any base classes)
*/
std::vector<ClassBases> getAllBases(parser::const_class_item_t item, const parser::Collection& collection)
{
    std::vector<ClassBases> result;

    getAllBasesImpl(result, item, collection);

    return result;
}

std::string getExtends(parser::const_class_item_t item)
{
    using namespace parser;
    using namespace utils;

    auto classFullName = [item](std::string name, std::string prefix)
    {
        prefix = collapseType(item->prefix(), prefix);
        std::string result = !prefix.empty() ? prefix + "." + name : name;
        return result;
    };

    auto bases = getAllBases(item, Collection::get());

    std::vector<std::string> extends;

    for (auto level = 0; level < bases.size(); level++)
    {
        std::vector<std::string> inherits;

        for (const auto& it : bases.at(level).items)
        {
            AnnotationList annotations(getAnnotations(it->decl()));

            // collect all annotated class
            if (annotations.exist("TS_EXPORT"))
            {
                inherits.push_back(classFullName(it->name(), it->prefix()));
            }

            // not more than one annotated class on the level of inheritance
            if (inherits.size() > 1)
            {
                throw Exception(R"(Multiple inheritance: class "%s")", bases.at(level).name.c_str());
            }

            if (extends.empty())
                extends = inherits;
        }
    }

    return !extends.empty() ? extends.at(0) : "";
}

std::vector<generator::ts::field_block_t> getFields(parser::const_class_item_t item)
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

    // find size of bases classes
    auto bases = getAllBases(item, Collection::get());
    int basesSize = 0;

    for (const auto& it : bases)
    {
        if (item->name() == it.name && item->prefix() == it.prefix)
        {
            for (const auto& it : it.items)
            {
                basesSize += it->size();
            }

            break;
        }
    }

    int size = item->size() - basesSize;

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
            std::string name = strprintf("p%d", n);
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
            AnnotationList annotations(getAnnotations(it.decl()));

            auto method = makeMethod(item, it, typeMapper, annotations);

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
        AnnotationList annotations(getAnnotations(it.decl()));

        auto method = makeMethod(item, it, typeMapper, annotations);

        if (method)
        {
            result.push_back(method);
        }
    }

    return result;
}

} // namespace analyzer
