#pragma once

#include "generator/ContainerBlock.h"
#include "generator/ImportBlock.h"
#include "generator/NamespaceBlock.h"

#include "parser/NamespaceItem.h"

namespace analyzer
{

generator::ts::namespace_block_t makeNamespace(parser::const_namespace_item_t item,
                                               generator::ts::container_block_t parentBlock);

} // namespace analyzer
