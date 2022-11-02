/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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
#include "generator/NamespaceBlock.h"

#include "parser/NamespaceItem.h"

namespace analyzer
{

generator::ts::namespace_block_t makeNamespace(parser::const_namespace_item_t item,
                                               generator::ts::container_block_t parentBlock);

} // namespace analyzer
