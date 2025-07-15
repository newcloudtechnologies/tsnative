#pragma once

#include "TypeUtils.h"

#include "generator/ContainerBlock.h"

#include "parser/EnumItem.h"

namespace analyzer
{

void makeEnum(parser::const_enum_item_t item, const TypeMapper& typeMapper, generator::ts::container_block_t block);

} // namespace analyzer
