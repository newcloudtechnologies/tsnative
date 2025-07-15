#include "ModuleBlock.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

ModuleBlock::ModuleBlock(const std::string& name, bool isDeclare)
    : NamespaceBlock(Type::MODULE, name, false, isDeclare)
{
}

void ModuleBlock::printHeader(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img = strprintf(R"(%smodule "%s" {)", m_isDeclare ? "declare " : "", name().c_str());

    printer->print(img);
    printer->enter();
}

void ModuleBlock::printChildImpl(int index,
                                 int size,
                                 const_abstract_block_t child,
                                 generator::print::printer_t printer) const
{
    if (child->type() != AbstractBlock::Type::IMPORT)
    {
        printer->enter();
    }

    child->print(printer);
}

} // namespace ts

} // namespace generator