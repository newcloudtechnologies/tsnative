#pragma once

#include "ContainerBlock.h"

#include <string>

namespace generator
{

namespace ts
{

class File : public ContainerBlock
{
    friend class AbstractBlock;

protected:
    void printBody(generator::print::printer_t printer) const override;
    void printChildImpl(int index,
                        int size,
                        const_abstract_block_t child,
                        generator::print::printer_t printer) const override;

private:
    File();
};

using file_t = block_t<File>;

} // namespace ts

} // namespace generator