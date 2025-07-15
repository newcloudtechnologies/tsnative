#include "EnumBlock.h"

#include "utils/Strings.h"

namespace generator
{

namespace ts
{

EnumeratorBlock::EnumeratorBlock(const std::string& name, const std::string& value)
    : AbstractBlock(Type::ENUMERATOR, name)
    , m_value(value)
{
}

void EnumeratorBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img;

    if (!m_value.empty())
    {
        img = strprintf(R"(%s = %s,)", name().c_str(), m_value.c_str());
    }
    else
    {
        img = strprintf(R"(%s,)", name().c_str(), m_value.c_str());
    }

    printer->print(img);
    printer->enter();
}

EnumBlock::EnumBlock(const std::string& name)
    : AbstractBlock(Type::ENUM, name)
{
}

void EnumBlock::printHeader(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img = strprintf(R"(enum %s {)", name().c_str());

    printer->print(img);
    printer->enter();
}

void EnumBlock::printBody(generator::print::printer_t printer) const
{
    printer->tab();

    for (const auto& it : m_enumerators)
    {
        it->print(printer);
    }

    printer->backspace();
}

void EnumBlock::printFooter(generator::print::printer_t printer) const
{
    std::string img = "}";

    printer->print(img);
    printer->enter();
}

void EnumBlock::addEnumerator(const_enumerator_block_t enumerator)
{
    m_enumerators.push_back(enumerator);
}

} // namespace ts

} // namespace generator