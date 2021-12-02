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

#include "Decorator.h"

#include "utils/Exception.h"

namespace generator
{

namespace ts
{

Decorator::Decorator(const std::string& name)
    : m_name(name)
{
}

void Decorator::addArgument(const std::string& arg)
{
    m_arguments.push_back(arg);
}

void Decorator::print(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string arguments = join(m_arguments);

    std::string img = !arguments.empty() ? strprintf(R"(@%s(%s))", m_name.c_str(), arguments.c_str())
                                         : strprintf(R"(@%s)", m_name.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator
