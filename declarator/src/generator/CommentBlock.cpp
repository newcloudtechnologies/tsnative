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

#include "CommentBlock.h"

#include <sstream>

namespace generator
{

namespace ts
{

CommentBlock::CommentBlock(const std::string& text)
    : AbstractBlock(Type::COMMENT)
    , m_text(text)
{
}

void CommentBlock::printHeader(generator::print::printer_t printer) const
{
    printer->print("/*");
    printer->enter();
}

void CommentBlock::printBody(generator::print::printer_t printer) const
{
    std::stringstream iss(m_text);

    for (std::string line; std::getline(iss, line);)
    {
        line.insert(0, " * ");
        printer->print(line);
        printer->enter();
    }
}

void CommentBlock::printFooter(generator::print::printer_t printer) const
{
    printer->print("*/");
    printer->enter();
}

} // namespace ts

} // namespace generator
