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

#include "TypeUtils.h"

#include "generator/ContainerBlock.h"

#include "parser/FunctionItem.h"

namespace analyzer
{

void makeFunction(parser::const_function_item_t item,
                  const TypeMapper& typeMapper,
                  generator::ts::container_block_t block);

} // namespace analyzer
