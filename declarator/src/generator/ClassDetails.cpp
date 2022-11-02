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

#include "ClassDetails.h"

#include "utils/Strings.h"

#include <algorithm>

namespace generator
{

namespace ts
{

TemplateParameterValue::TemplateParameterValue(const std::string& type, bool isSpread)
    : m_type(type)
    , m_isSpread(isSpread)
{
}

std::string TemplateParameterValue::toString() const
{
    using namespace utils;

    // TODO: support spread parameters for generic class

    std::string img;

    img = m_type;

    return img;
}

std::string formatTemplateParameterList(const std::vector<TemplateParameterValue>& parameters)
{
    using namespace utils;

    std::string img;

    std::vector<std::string> plist;

    std::transform(
        parameters.begin(), parameters.end(), std::back_inserter(plist), [](const auto& it) { return it.toString(); });

    img = join(plist);

    return img;
}

} // namespace ts
} // namespace generator
