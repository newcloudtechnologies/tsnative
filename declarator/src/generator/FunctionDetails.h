#pragma once

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

struct ArgumentValue
{
    std::string name;
    std::string type;
    bool isSpread = false;
    bool isOptional = false;

public:
    ArgumentValue();
    ArgumentValue(const std::string& name, const std::string& type, bool isSpread = false, bool isOptional = false);

    std::string toString() const;
};

std::string formatArgumentList(const std::vector<ArgumentValue>& arguments);
std::string formatTemplateArgumentList(const std::vector<std::string>& templateArguments);
std::string formatReturnType(const std::string& retType);

} // namespace ts

} // namespace generator
