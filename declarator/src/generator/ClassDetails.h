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
