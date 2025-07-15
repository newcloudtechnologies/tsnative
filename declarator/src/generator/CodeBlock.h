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
