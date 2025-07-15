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
