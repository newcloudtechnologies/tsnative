#pragma once

#include "OperatorBlock.h"

#include <string>

namespace generator
{

namespace ts
{

class ComputedPropertyNameBlock : public OperatorBlock
{
    friend class AbstractBlock;

private:
    std::string m_propertyName;

protected:
    void printBody(generator::print::printer_t printer) const override;

protected:
    ComputedPropertyNameBlock(const std::string& propertyName, const std::string& retType);
};

using computed_property_name_block_t = block_t<ComputedPropertyNameBlock>;
using const_computed_property_name_block_t = block_t<const ComputedPropertyNameBlock>;

} // namespace ts

} // namespace generator