#pragma once

#include "TypeUtils.h"

#include "generator/ContainerBlock.h"

#include "parser/ClassItem.h"

namespace analyzer
{

void makeClass(parser::const_class_item_t item, const TypeMapper& typeMapper, generator::ts::container_block_t block);

} // namespace analyzer
