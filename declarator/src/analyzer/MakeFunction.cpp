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

#include "MakeFunction.h"

#include "generator/FunctionBlock.h"

#include "parser/Annotation.h"

#include "constants/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <algorithm>

namespace analyzer
{

void makeFunction(parser::const_function_item_t item,
                  const TypeMapper& typeMapper,
                  generator::ts::container_block_t block)
{
    using namespace constants::annotations;
    using namespace generator::ts;
    using namespace utils;
    using namespace parser;

    AnnotationList annotations(getAnnotations(item->decl()));
    
    auto children = block->children();

    auto it = std::find_if(
        children.begin(), children.end(), [name = item->name()](const auto& it) { return it->name() == name; });

    if (it != children.end())
    {
        throw utils::Exception(
            R"(function with name "%s" is already exist in scope "%s". TypeScrips doesn't support reloading functions)",
            item->name().c_str(),
            item->prefix().c_str());
    }

    std::string name = annotations.exist(TS_NAME) ? annotations.values(TS_NAME).at(0) : item->name();

    std::string retType = annotations.exist(TS_RETURN_TYPE)
                              ? annotations.values(TS_RETURN_TYPE).at(0)
                              : collapseType(item->prefix(), mapType(typeMapper, item->returnType()));

    function_block_t functionBlock = AbstractBlock::make<FunctionBlock>(name, retType, true);

    for (const auto& it : item->parameters())
    {
        functionBlock->addArgument(it.name(), collapseType(item->prefix(), mapType(typeMapper, it.type())), false);
    }

    block->add(functionBlock);
}

} // namespace analyzer
