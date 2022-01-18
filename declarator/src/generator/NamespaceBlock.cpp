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

#include "NamespaceBlock.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

NamespaceBlock::NamespaceBlock(Type type, const std::string& name)
    : ContainerBlock(type, name)
{
}

NamespaceBlock::NamespaceBlock(const std::string& name, bool isExport)
    : ContainerBlock(Type::NAMESPACE, name)
    , m_isExport(isExport)
{
}

void NamespaceBlock::printHeader(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img = strprintf(R"(%snamespace %s {)", m_isExport ? "export " : "", name().c_str());

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