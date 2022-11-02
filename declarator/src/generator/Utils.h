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

#include "AbstractBlock.h"
#include "ContainerBlock.h"

#include <functional>
#include <string>

namespace generator
{

namespace ts
{

abstract_block_t getBlock(abstract_block_t root,
                          const std::string& path,
                          std::function<abstract_block_t(container_block_t block, const std::string& name)> find);

} // namespace ts

} // namespace generator
