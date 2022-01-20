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

#include "Analyzer.h"
#include "Annotation.h"
#include "MakeClass.h"
#include "MakeCodeBlock.h"
#include "MakeEnum.h"
#include "MakeFunction.h"
#include "MakeGenericClass.h"
#include "MakeNamespace.h"

#include "parser/Annotation.h"
#include "parser/ClassItem.h"
#include "parser/ClassTemplateItem.h"
#include "parser/Collection.h"
#include "parser/EnumItem.h"
#include "parser/FunctionItem.h"
#include "parser/FunctionTemplateItem.h"
#include "parser/NamespaceItem.h"

#include "generator/AbstractBlock.h"
#include "generator/ClassBlock.h"
#include "generator/EnumBlock.h"
#include "generator/FieldBlock.h"
#include "generator/FunctionBlock.h"
#include "generator/ImportBlock.h"
#include "generator/MethodBlock.h"
#include "generator/ModuleBlock.h"
#include "generator/NamespaceBlock.h"
#include "generator/Utils.h"

#include "constants/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <algorithm>
#include <map>
#include <string>

namespace
{

void do_create(parser::const_abstract_item_t item,
               const analyzer::TypeMapper& typeMapper,
               const std::vector<generator::ts::import_block_t>& importBlocks,
               generator::ts::abstract_block_t block)
{
    using namespace parser;
    using namespace analyzer;
    using namespace generator::ts;

    switch (item->type())
    {
        case AbstractItem::Type::NAMESPACE:
        {
            _ASSERT(AbstractBlock::isContainerBlock(block));

            makeNamespace(std::static_pointer_cast<const NamespaceItem>(item),
                          importBlocks,
                          std::static_pointer_cast<ContainerBlock>(block));
            break;
        }
        case AbstractItem::Type::CLASS:
        {
            _ASSERT(AbstractBlock::isContainerBlock(block));

            makeClass(std::static_pointer_cast<const ClassItem>(item),
                      typeMapper,
                      std::static_pointer_cast<ContainerBlock>(block));
            break;
        }
        case AbstractItem::Type::CLASS_TEMPLATE:
        {
            _ASSERT(AbstractBlock::isContainerBlock(block));

            makeGenericClass(std::static_pointer_cast<const ClassTemplateItem>(item),
                             typeMapper,
                             std::static_pointer_cast<ContainerBlock>(block));
            break;
        }
        case AbstractItem::Type::ENUM:
        {
            _ASSERT(AbstractBlock::isContainerBlock(block));

            makeEnum(std::static_pointer_cast<const EnumItem>(item),
                     typeMapper,
                     std::static_pointer_cast<ContainerBlock>(block));
            break;
        }
        case AbstractItem::Type::FUNCTION:
        {
            _ASSERT(AbstractBlock::isContainerBlock(block));

            makeFunction(std::static_pointer_cast<const FunctionItem>(item),
                         typeMapper,
                         std::static_pointer_cast<ContainerBlock>(block));
            break;
        }
        case AbstractItem::Type::FUNCTION_TEMPLATE:
        {
            _ASSERT(AbstractBlock::isContainerBlock(block));

            // TODO: handle template functions
            // here ordinary function is used
            // template parameters ignore
            makeFunction(std::static_pointer_cast<const FunctionTemplateItem>(item),
                         typeMapper,
                         std::static_pointer_cast<ContainerBlock>(block));
            break;
        }
        case AbstractItem::Type::CODE_BLOCK:
        {
            makeCodeBlock(std::static_pointer_cast<const CodeBlockItem>(item), typeMapper, block);
            break;
        }
        default:
        {
            throw utils::Exception(R"(type of item "%s" is not supported)", typeToString(item->type()).c_str());
        }
    };
}

} //  namespace

namespace analyzer
{

parser::item_list_t getSuitableItems(const parser::Collection& collection)
{
    using namespace constants::annotations;
    using namespace parser;

    parser::item_list_t result;

    collection.visit(
        [&result](const parser::abstract_item_t item)
        {
            AnnotationList anotations(getItemAnnotations(item));

            if (item->isLocal() && (anotations.exist(TS_MODULE) || anotations.exist(TS_NAMESPACE) ||
                                    anotations.exist(TS_EXPORT) || anotations.exist(TS_CODE)))
            {
                result.push_back(item);
            }
        });

    return result;
}

analyzer::TypeMapper makeTypeMapper(const parser::Collection& collection)
{
    using namespace constants::annotations;
    using namespace parser;
    using namespace utils;

    auto getClassFullName = [](const std::string& name, const std::string& nsPrefix)
    { return !nsPrefix.empty() ? nsPrefix + "::" + name : name; };

    std::map<std::string, std::string> table;

    collection.visit(
        [&table, getClassFullName](const parser::abstract_item_t item)
        {
            AnnotationList anotations(getItemAnnotations(item));

            if (anotations.exist(TS_NAME))
            {
                table.insert(
                    std::make_pair(getClassFullName(item->name(), item->prefix()), anotations.values(TS_NAME).at(0)));
            }
        });

    return table;
}

generator::ts::abstract_block_t analyze(parser::const_abstract_item_t item,
                                        const TypeMapper& typeMapper,
                                        const std::vector<generator::ts::import_block_t>& importBlocks,
                                        generator::ts::abstract_block_t file)
{
    using namespace generator::ts;
    using namespace parser;

    _ASSERT(file->type() == AbstractBlock::Type::FILE);

    auto root = std::static_pointer_cast<File>(file);

    auto find = [item](container_block_t parent, const std::string& name)
    {
        abstract_block_t result;
        bool hasNamesake = false;

        auto isCodeBlockInside = [item](const generator::ts::abstract_block_t& parentBlock)
        {
            bool result = false;

            result = (item->type() == AbstractItem::Type::CODE_BLOCK &&
                      AbstractItem::getParentName(item) == parentBlock->name());

            return result;
        };

        // looking for containers
        for (const auto& it : parent->children())
        {
            if (it->name() == name)
            {
                // item should be either a container or contains code block inside
                if (AbstractBlock::isContainerBlock(it) || isCodeBlockInside(it))
                {
                    result = it;
                }
                else
                {
                    hasNamesake = true;
                }

                break;
            }
        }

        // This case handles nested entities, eg. enum inside class.
        // Create namespace with name of class and put enum there.
        if (hasNamesake)
        {
            result = AbstractBlock::make<NamespaceBlock>(name, true);
            parent->add_before(name, result);
        }

        return result;
    };

    // find container (is not always) block with prefix
    auto block = getBlock(root, item->prefix(), find);

    if (block)
    {
        do_create(item, typeMapper, importBlocks, block);
    }

    return file;
}

} // namespace analyzer