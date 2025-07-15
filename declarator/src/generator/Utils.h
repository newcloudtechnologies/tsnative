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
