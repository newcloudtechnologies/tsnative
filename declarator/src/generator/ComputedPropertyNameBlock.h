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