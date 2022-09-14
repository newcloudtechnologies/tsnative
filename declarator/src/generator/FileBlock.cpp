/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "FileBlock.h"

namespace generator
{

namespace ts
{

File::File()
    : ContainerBlock(Type::FILE)
{
}

void File::printBody(generator::print::printer_t printer) const
{
    ContainerBlock::printBodyImpl(printer);
}

void File::printChildImpl(int index, int size, const_abstract_block_t child, generator::print::printer_t printer) const
{
    if (child->type() != AbstractBlock::Type::IMPORT && child->type() != AbstractBlock::Type::COMMENT)
    {
        printer->enter();
    }

    child->print(printer);
}

} // namespace ts

} // namespace generator