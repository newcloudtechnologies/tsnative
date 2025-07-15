#pragma once

#include "TypeUtils.h"

#include "generator/ContainerBlock.h"

#include "parser/FunctionItem.h"
#include "parser/FunctionTemplateItem.h"

namespace analyzer
{

void makeFunction(parser::const_function_item_t item,
                  const TypeMapper& typeMapper,
                  generator::ts::container_block_t block);

} // namespace analyzer
