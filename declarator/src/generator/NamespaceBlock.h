#pragma once

#include "ContainerBlock.h"

#include <string>

namespace generator
{

namespace ts
{

class NamespaceBlock : public ContainerBlock
{
    friend class AbstractBlock;

protected:
    bool m_isExport;
    bool m_isDeclare;

protected:
    NamespaceBlock(Type type, const std::string& name, bool isExport, bool isDeclare);

    void printHeader(generator::print::printer_t printer) const override;
    void printFooter(generator::print::printer_t printer) const override;

private:
    NamespaceBlock(const std::string& name, bool isExport, bool isDeclare);

public:
    virtual ~NamespaceBlock() = default;
};

using namespace_block_t = block_t<NamespaceBlock>;
using const_namespace_block_t = block_t<const NamespaceBlock>;

} // namespace ts

} // namespace generator