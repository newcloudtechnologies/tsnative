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

#include "CodeBlock.h"

#include <sstream>

namespace generator
{

namespace ts
{

CodeBlock::CodeBlock(const std::string& code)
    : AbstractBlock(Type::CODE_BLOCK)
    , m_code(code)
{
}

void CodeBlock::printBody(generator::print::printer_t printer) const
{
    std::stringstream iss(m_code);

    for (std::string line; std::getline(iss, line);)
    {
        printer->print(line);
        printer->enter();
    }
}

} // namespace ts

} // namespace generator
