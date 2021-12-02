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
#include "MakeClass.h"
#include "MakeEnum.h"
#include "MakeFunction.h"
#include "MakeGenericClass.h"

#include "parser/Annotation.h"
#include "parser/ClassItem.h"
#include "parser/ClassTemplateItem.h"
#include "parser/Collection.h"
#include "parser/EnumItem.h"
#include "parser/FunctionItem.h"

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

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <algorithm>
#include <map>
#include <string>

namespace
{

void do_create(parser::const_abstract_item_t item,
               const analyzer::TypeMapper& typeMapper,
               generator::ts::container_block_t block)
{
    using namespace parser;

    switch (item->type())
    {
        case AbstractItem::Type::CLASS:
        {
            makeClass(std::static_pointer_cast<const ClassItem>(item), typeMapper, block);
            break;
        }
        case AbstractItem::Type::CLASS_TEMPLATE:
        {
            makeGenericClass(std::static_pointer_cast<const ClassTemplateItem>(item), typeMapper, block);
            break;
        }
        case AbstractItem::Type::ENUM:
        {
            makeEnum(std::static_pointer_cast<const EnumItem>(item), typeMapper, block);
            break;
        }
        case AbstractItem::Type::FUNCTION:
        {
            makeFunction(std::static_pointer_cast<const FunctionItem>(item), typeMapper, block);
            break;
        }
        default:
        {
            throw utils::Exception(R"(type of items "%s" is not supported)", typeToString(item->type()).c_str());
        }
    };
}

std::string getAnnotations(parser::const_abstract_item_t item)
{
    using namespace parser;

    std::string result;

    switch (item->type())
    {
        case AbstractItem::Type::NAMESPACE:
        {
            // TODO: Support annotations for namespace
            break;
        }
        case AbstractItem::Type::CLASS:
        {
            result = parser::getAnnotations(AbstractItem::decl<const ClassItem>(item));
            break;
        }
        case AbstractItem::Type::CLASS_TEMPLATE:
        {
            result = parser::getAnnotations(AbstractItem::decl<const ClassTemplateItem>(item));
            break;
        }
        case AbstractItem::Type::ENUM:
        {
            result = parser::getAnnotations(AbstractItem::decl<const EnumItem>(item));
            break;
        }
        case AbstractItem::Type::FUNCTION:
        {
            result = parser::getAnnotations(AbstractItem::decl<const FunctionItem>(item));
            break;
        }
        default:
        {
            throw utils::Exception(R"(type of items "%s" is not supported)", typeToString(item->type()).c_str());
        }
    };

    return result;
}

} //  namespace

namespace analyzer
{

parser::item_list_t getSuitableItems(const parser::Collection& collection)
{
    using namespace parser;

    parser::item_list_t result;

    collection.visit(
        [&result](const parser::abstract_item_t item)
        {
            std::string s = getAnnotations(item);

            AnnotationList anotations(s);

            if (item->isLocal() && anotations.exist("TS_EXPORT"))
            {
                result.push_back(item);
            }
        });

    return result;
}

analyzer::TypeMapper makeTypeMapper(const parser::Collection& collection)
{
    using namespace parser;
    using namespace utils;

    auto getClassFullName = [](const std::string& name, const std::string& nsPrefix)
    { return !nsPrefix.empty() ? nsPrefix + "::" + name : name; };

    std::map<std::string, std::string> table;

    collection.visit(
        [&table, getClassFullName](const parser::abstract_item_t item)
        {
            AnnotationList anotations(getAnnotations(item));

            if (anotations.exist("TS_NAME"))
            {
                table.insert(
                    std::make_pair(getClassFullName(item->name(), item->prefix()), anotations.value("TS_NAME")));
            }
        });

    return table;
}

generator::ts::abstract_block_t analyze(parser::const_abstract_item_t item,
                                        const TypeMapper& typeMapper,
                                        const std::vector<std::pair<std::string, std::string>>& imports,
                                        generator::ts::abstract_block_t file)
{
    using namespace generator::ts;

    _ASSERT(file->type() == AbstractBlock::Type::FILE);

    auto root = std::static_pointer_cast<File>(file);

    auto find_or_create = [root, imports](container_block_t parent, const std::string& name)
    {
        abstract_block_t result;
        block_list_t containers;
        bool hasNamesake = false;

        // looking for containers
        for (const auto& it : parent->children())
        {
            if (it->name() == name)
            {
                AbstractBlock::isContainerBlock(it) ? containers.push_back(it) : (void)(hasNamesake = true);
            }
        }

        if (!containers.empty())
        {
            // only one block with such name
            _ASSERT(containers.size() == 1);
            result = containers.at(0);
        }
        else
        {
            // create module on top level
            if (parent == root)
            {
                result = AbstractBlock::make<ModuleBlock>(name);

                for (const auto& [entity, path] : imports)
                {
                    std::static_pointer_cast<ModuleBlock>(result)->add(AbstractBlock::make<ImportBlock>(entity, path));
                }

                parent->add(result);
            }
            else
            {
                result = AbstractBlock::make<NamespaceBlock>(name, true);

                // put namespace before if we have other element with the same name, suck a class
                hasNamesake ? parent->add_before(name, result) : parent->add(result);
            }
        }

        return result;
    };

    // find container block with prefix
    auto block = getBlock(root, item->prefix(), find_or_create);

    _ASSERT(AbstractBlock::isContainerBlock(block));
    auto containerBlock = std::static_pointer_cast<ContainerBlock>(block);

    do_create(item, typeMapper, containerBlock);

    return file;
}

} // namespace analyzer