/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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