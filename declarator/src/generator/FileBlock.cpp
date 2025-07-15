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