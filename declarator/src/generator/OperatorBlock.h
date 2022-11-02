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
#include "AbstractMethodBlock.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class OperatorBlock : public AbstractMethodBlock
{
    friend class AbstractBlock;

protected:
    OperatorBlock(Type type, const std::string& retType);

public:
    virtual ~OperatorBlock() = default;
};

using operator_block_t = block_t<OperatorBlock>;
using const_operator_block_t = block_t<const OperatorBlock>;
using operator_list_block_t = std::vector<operator_block_t>;
using const_operator_list_block_t = std::vector<const_operator_block_t>;

} // namespace ts

} // namespace generator