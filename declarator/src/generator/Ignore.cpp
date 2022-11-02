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

#include "Ignore.h"

namespace generator
{

namespace ts
{

Ignore::Ignore()
{
}

void Ignore::print(generator::print::printer_t printer) const
{
    printer->print(R"(//@ts-ignore)");
    printer->enter();
}

} // namespace ts

} // namespace generator
