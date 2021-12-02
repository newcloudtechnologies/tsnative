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

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace analyzer
{

void makeFunction(parser::const_function_item_t item,
                  const TypeMapper& typeMapper,
                  generator::ts::container_block_t block)
{
    using namespace generator::ts;
    using namespace utils;
    using namespace parser;

    function_block_t functionBlock = AbstractBlock::make<FunctionBlock>(
        item->name(), collapseType(item->prefix(), mapType(typeMapper, item->returnType())), true);

    for (const auto& it : item->parameters())
    {
        functionBlock->addArgument(it.name(), collapseType(item->prefix(), mapType(typeMapper, it.type())), false);
    }

    block->add(functionBlock);
}

} // namespace analyzer
