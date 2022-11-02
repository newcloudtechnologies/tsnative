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

#include "TypeUtils.h"

#include "generator/ContainerBlock.h"

#include "parser/CodeBlockItem.h"

namespace analyzer
{

void makeCodeBlock(parser::const_code_block_item_t item,
                   const TypeMapper& typeMapper,
                   generator::ts::abstract_block_t block);

} // namespace analyzer
