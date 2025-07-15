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
