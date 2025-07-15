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
