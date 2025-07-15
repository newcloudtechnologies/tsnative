#pragma once

#include "FunctionDetails.h"
#include "OperatorBlock.h"

#include <string>

namespace generator
{

namespace ts
{

class IndexSignatureBlock : public OperatorBlock
{
    friend class AbstractBlock;

private:
    ArgumentValue m_argument;

protected:
    IndexSignatureBlock(const std::string& retType);
    void printBody(generator::print::printer_t printer) const override;

public:
    void setArgument(const ArgumentValue& arg);
};

using index_signature_block_t = block_t<IndexSignatureBlock>;
using const_index_signature_block_t = block_t<const IndexSignatureBlock>;

} // namespace ts

} // namespace generator