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

#include "FunctionDetails.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <algorithm>

namespace generator
{

namespace ts
{

ArgumentValue::ArgumentValue(const std::string& name, const std::string& type, bool isSpread)
    : m_name(name)
    , m_type(type)
    , m_isSpread(isSpread)
{
}

std::string ArgumentValue::toString() const
{
    using namespace utils;

    std::string img;

    if (m_isSpread)
    {
        img += strprintf(R"(...%s: %s[])", m_name.c_str(), m_type.c_str());
    }
    else
    {
        img += strprintf(R"(%s: %s)", m_name.c_str(), m_type.c_str());
    }

    return img;
}

std::string formatArgumentList(const std::vector<ArgumentValue>& arguments)
{
    using namespace utils;

    std::string img;

    std::vector<std::string> plist;

    std::transform(
        arguments.begin(), arguments.end(), std::back_inserter(plist), [](const auto& it) { return it.toString(); });

    img = join(plist);

    return img;
}

std::string formatReturnType(const std::string& retType)
{
    using namespace utils;

    std::string img;

    if (!retType.empty())
    {
        img = strprintf(R"(: %s)", retType.c_str());
    }

    return img;
}

} // namespace ts

} // namespace generator
