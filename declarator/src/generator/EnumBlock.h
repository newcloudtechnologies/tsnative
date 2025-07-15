#pragma once

#include "AbstractBlock.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class EnumeratorBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::string m_value;

protected:
    void printBody(generator::print::printer_t printer) const override;

private:
    EnumeratorBlock(const std::string& name, const std::string& value = "");
};

using enumerator_block_t = block_t<EnumeratorBlock>;
using const_enumerator_block_t = block_t<const EnumeratorBlock>;

class EnumBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::vector<const_enumerator_block_t> m_enumerators;

protected:
    void printHeader(generator::print::printer_t printer) const override;
    void printBody(generator::print::printer_t printer) const override;
    void printFooter(generator::print::printer_t printer) const override;

private:
    EnumBlock(const std::string& name);

public:
    void addEnumerator(const_enumerator_block_t enumerator);
};

using enum_block_t = block_t<EnumBlock>;
using const_enum_block_t = block_t<const EnumBlock>;

} // namespace ts

} // namespace generator