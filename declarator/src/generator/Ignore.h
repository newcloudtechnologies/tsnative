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

#pragma once

#include "Printer.h"

#include <memory>

namespace generator
{

namespace ts
{

class Ignore;
using ignore_t = std::shared_ptr<Ignore>;

class Ignore
{
private:
    Ignore();

public:
    void print(generator::print::printer_t printer) const;

    static ignore_t make()
    {
        ignore_t result(new Ignore());
        return result;
    }
};

} // namespace ts

} // namespace generator
