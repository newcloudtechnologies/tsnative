#include "FunctionDetails.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <algorithm>

namespace generator
{

namespace ts
{

ArgumentValue::ArgumentValue()
{
}

ArgumentValue::ArgumentValue(const std::string& _name, const std::string& _type, bool _isSpread, bool _isOptional)
    : name(_name)
    , type(_type)
    , isSpread(_isSpread)
    , isOptional(_isOptional)
{
}

std::string ArgumentValue::toString() const
{
    using namespace utils;

    std::string img =
        strprintf(R"(%s%s%s: %s)", isSpread ? "..." : "", name.c_str(), isOptional ? "?" : "", type.c_str());

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

std::string formatTemplateArgumentList(const std::vector<std::string>& templateArguments)
{
    using namespace utils;

    std::string img;

    if (!templateArguments.empty())
    {
        img = join(templateArguments);
        img = strprintf(R"(<%s>)", img.c_str());
    }

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
