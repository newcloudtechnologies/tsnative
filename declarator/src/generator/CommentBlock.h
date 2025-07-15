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
