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

#pragma once

#include "generator/ContainerBlock.h"
#include "generator/ImportBlock.h"

#include "parser/NamespaceItem.h"

namespace analyzer
{

void makeNamespace(parser::const_namespace_item_t item,
                   const std::vector<generator::ts::import_block_t>& importBlocks,
                   generator::ts::container_block_t block);

} // namespace analyzer
