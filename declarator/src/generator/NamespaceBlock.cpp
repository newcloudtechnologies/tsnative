#include "NamespaceBlock.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

NamespaceBlock::NamespaceBlock(Type type, const std::string& name, bool isExport, bool isDeclare)
    : ContainerBlock(type, name)
    , m_isExport(isExport)
    , m_isDeclare(isDeclare)
{
}

NamespaceBlock::NamespaceBlock(const std::string& name, bool isExport, bool isDeclare)
    : ContainerBlock(Type::NAMESPACE, name)
    , m_isExport(isExport)
    , m_isDeclare(isDeclare)
{
}

void NamespaceBlock::printHeader(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img =
        strprintf(R"(%s%snamespace %s {)", m_isExport ? "export " : "", m_isDeclare ? "declare " : "", name().c_str());

    printer->print(img);
    printer->enter();
}

void NamespaceBlock::printFooter(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img = "}";

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator