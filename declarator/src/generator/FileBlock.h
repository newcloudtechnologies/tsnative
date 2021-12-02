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

private:
    File();
};

using file_t = block_t<File>;

} // namespace ts

} // namespace generator