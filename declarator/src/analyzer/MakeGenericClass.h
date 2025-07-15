#pragma once

#include "TypeUtils.h"

#include "generator/ContainerBlock.h"

#include "parser/ClassTemplateItem.h"

namespace analyzer
{

void makeGenericClass(parser::const_class_template_item_t item,
                      const TypeMapper& typeMapper,
                      generator::ts::container_block_t block);

} // namespace analyzer
