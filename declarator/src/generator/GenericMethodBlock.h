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

class GenericMethodBlock : public MethodBlock
{
    friend class AbstractBlock;

private:
    std::vector<std::string> m_templateArguments;

protected:
    GenericMethodBlock(); // constructor
    GenericMethodBlock(const std::string& name, const std::string& retType, bool isStatic);

    void printBody(generator::print::printer_t printer) const override;

public:
    void addTemplateArgument(const std::string& type);
};

using generic_method_block_t = block_t<GenericMethodBlock>;
using const_generic_method_block_t = block_t<const GenericMethodBlock>;
using generic_method_list_block_t = std::vector<generic_method_block_t>;
using const_generic_method_list_block_t = std::vector<const_generic_method_block_t>;

} // namespace ts

} // namespace generator