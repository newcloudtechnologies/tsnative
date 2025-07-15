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
