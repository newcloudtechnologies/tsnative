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

#include <string>

namespace generator
{

namespace ts
{

class CodeBlock : public AbstractBlock
{
    std::string m_code;

protected:
    void printBody(generator::print::printer_t printer) const override;

public:
    CodeBlock(const std::string& code);
};

using code_block_t = block_t<CodeBlock>;
using const_code_block_t = block_t<const CodeBlock>;

} // namespace ts

} // namespace generator
