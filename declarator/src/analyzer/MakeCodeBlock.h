#pragma once

#include "TypeUtils.h"

#include "generator/ContainerBlock.h"

#include "parser/CodeBlockItem.h"

namespace analyzer
{

void makeCodeBlock(parser::const_code_block_item_t item,
                   const TypeMapper& typeMapper,
                   generator::ts::abstract_block_t block);

} // namespace analyzer
