#pragma once

#include "NamespaceBlock.h"

#include <string>

namespace generator
{

namespace ts
{

class ModuleBlock : public NamespaceBlock
{
    friend class AbstractBlock;

protected:
    void printHeader(generator::print::printer_t printer) const override;

    void printChildImpl(int index,
                        int size,
                        const_abstract_block_t child,
                        generator::print::printer_t printer) const override;

private:
    ModuleBlock(const std::string& name, bool isDeclare = true);
};

using module_block_t = block_t<ModuleBlock>;
using const_module_block_t = block_t<const ModuleBlock>;

} // namespace ts

} // namespace generator