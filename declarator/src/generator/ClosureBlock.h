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

#include "MethodBlock.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class ClosureBlock : public MethodBlock
{
    friend class AbstractBlock;

protected:
    ClosureBlock(const std::string& name);
};

using closure_block_t = block_t<ClosureBlock>;
using const_closure_block_t = block_t<const ClosureBlock>;
using closure_list_block_t = std::vector<closure_block_t>;
using const_closure_list_block_t = std::vector<const_closure_block_t>;

} // namespace ts

} // namespace generator