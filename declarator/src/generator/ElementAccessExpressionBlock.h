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

#include "AbstractBlock.h"
#include "MethodBlock.h"

namespace generator
{

namespace ts
{

class ElementAccessExpressionBlock : public MethodBlock
{
    friend class AbstractBlock;

protected:
    void printBody(generator::print::printer_t printer) const override;

protected:
    ElementAccessExpressionBlock(const std::string& retType, bool isStatic);

public:
    void addArgument(const std::string& name, const std::string& type, bool isSpread) override;
};

using element_access_expression_block_t = block_t<MethodBlock>;
using const_element_access_expression_block_t = block_t<const MethodBlock>;

} // namespace ts

} // namespace generator
