#pragma once

#include "AbstractBlock.h"
#include "ClassBlock.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class GenericClassBlock : public ClassBlock
{
    friend class AbstractBlock;

protected:
    std::vector<TemplateParameterValue> m_templateParameters;

private:
    std::string formatTemplateParameters() const;

protected:
    void printHeader(generator::print::printer_t printer) const override;

private:
    GenericClassBlock(const std::string& name, bool isExport, bool isDeclare);

public:
    void addTemplateParameter(const TemplateParameterValue& p);
};

using class_block_t = block_t<ClassBlock>;
using const_class_block_t = block_t<const ClassBlock>;

} // namespace ts

} // namespace generator