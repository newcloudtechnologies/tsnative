/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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

// TODO: pass const child's container to be possible to analize previous childs
// needs to manage empty lines
void File::printChildImpl(int index, int size, const_abstract_block_t child, generator::print::printer_t printer) const
{
    // don't add line before first ContainerBlock's item
    if (index > 0)
    {
        auto type = child->type();
        switch (type)
        {
            // imports and comments should be squashed
            case AbstractBlock::Type::IMPORT:
            case AbstractBlock::Type::COMMENT:
            {
                break;
            }
            default:
            {
                printer->enter();
            }
        };
    }

    child->print(printer);
}

} // namespace ts

} // namespace generator