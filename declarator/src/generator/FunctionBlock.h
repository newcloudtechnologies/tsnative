#pragma once

#include "AbstractBlock.h"
#include "FunctionDetails.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class FunctionBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::vector<ArgumentValue> m_arguments;
    std::vector<std::string> m_templateArguments;
    std::string m_retType;
    bool m_isExport;
    bool m_isDeclare;

protected:
    void printBody(generator::print::printer_t printer) const override;

private:
    FunctionBlock(const std::string& name, const std::string& retType, bool isExport, bool isDeclare);

public:
    void addArgument(const std::string& name, const std::string& type, bool isSpread, bool isOptional);
    void addTemplateArgument(const std::string& type);
    bool isExport() const;
    bool isDeclare() const;
};

using function_block_t = block_t<FunctionBlock>;
using const_function_block_t = block_t<const FunctionBlock>;

} // namespace ts

} // namespace generator