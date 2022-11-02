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

class CommentBlock : public AbstractBlock
{
    std::string m_text;

protected:
    void printHeader(generator::print::printer_t printer) const override;
    void printBody(generator::print::printer_t printer) const override;
    void printFooter(generator::print::printer_t printer) const override;

public:
    CommentBlock(const std::string& text);
};

using comment_block_t = block_t<CommentBlock>;
using const_comment_block_t = block_t<const CommentBlock>;

} // namespace ts

} // namespace generator
