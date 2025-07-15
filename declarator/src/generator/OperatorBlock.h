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