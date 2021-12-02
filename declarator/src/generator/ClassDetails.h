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

#pragma once

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class TemplateParameterValue
{
    std::string m_type;
    bool m_isSpread;

public:
    TemplateParameterValue(const std::string& type, bool isSpread = false);

    std::string toString() const;
};

std::string formatTemplateParameterList(const std::vector<TemplateParameterValue>& parameters);

} // namespace ts
} // namespace generator
