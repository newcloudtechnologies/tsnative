#pragma once

#include "AbstractBlock.h"

#include <vector>

namespace generator
{

namespace ts
{

class FieldBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::string m_type;
    bool m_isPrivate;

protected:
    void printBody(generator::print::printer_t printer) const override;

private:
    FieldBlock(const std::string& name, const std::string& type, bool isPrivate);
};

using field_block_t = block_t<FieldBlock>;
using const_field_block_t = block_t<const FieldBlock>;
using field_list_block_t = std::vector<field_block_t>;
using const_field_list_block_t = std::vector<const_field_block_t>;

} // namespace ts

} // namespace generator