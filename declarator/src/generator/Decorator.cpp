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

#include "Decorator.h"

#include "utils/Exception.h"

#include <regex>

namespace
{

void addArgument(generator::ts::decorator_t decorator, const std::string& value)
{
    int vInt = 0;
    bool vBool = false;
    double vDbl = 0;

    utils::is_type<int>(value, vInt)      ? decorator->addArgument(vInt)
    : utils::is_type<bool>(value, vBool)  ? decorator->addArgument(vBool)
    : utils::is_type<double>(value, vDbl) ? decorator->addArgument(vDbl)
                                          : decorator->addArgument(value.c_str());
}

} //  namespace

namespace generator
{

namespace ts
{

Decorator::Decorator(const std::string& name, bool ignored)
    : m_name(name)
    , m_ignored(ignored)
{
}

void Decorator::addArgument(int arg)
{
    m_arguments.push_back(utils::strprintf(R"(%d)", arg));
}

void Decorator::addArgument(double arg)
{
    m_arguments.push_back(utils::strprintf(R"(%.2f)", arg));
}

void Decorator::addArgument(const char* arg)
{
    m_arguments.push_back(utils::strprintf(R"("%s")", arg));
}

void Decorator::print(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string arguments = join(m_arguments);

    std::string img = !arguments.empty() ? strprintf(R"(@%s(%s))", m_name.c_str(), arguments.c_str())
                                         : strprintf(R"(@%s)", m_name.c_str());

    if (m_ignored)
    {
        printer->print("//@ts-ignore");
        printer->enter();
    }

    printer->print(img);
    printer->enter();
}

decorator_t Decorator::fromString(const std::string& s)
{
    decorator_t result;

    std::regex regexp(R"(^([\w]*)(\((.*)\))?)");
    std::smatch match;

    if (!std::regex_search(s.begin(), s.end(), match, regexp))
    {
        throw utils::Exception(R"(invalid decorator signature: "%s")", s.c_str());
    }

    std::string name = match[1];
    std::string args = match[3];

    result = Decorator::make(name);

    if (!args.empty())
    {
        regexp.assign(R"(([^\,\'\s]+))");

        auto begin = std::sregex_iterator(args.begin(), args.end(), regexp);
        auto end = std::sregex_iterator();

        for (auto it = begin; it != end; ++it)
        {
            std::string arg = (*it).str();

            ::addArgument(result, arg);
        }
    }

    return result;
}

} // namespace ts

} // namespace generator
