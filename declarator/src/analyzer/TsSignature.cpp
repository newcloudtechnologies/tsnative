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

#include "TsSignature.h"

#include "utils/Exception.h"

namespace analyzer
{

void TsMethodSignature::parseFunction(const std::string& sig)
{
    std::regex regexp(R"(([a-zA-Z0-9_\<\>]+)\((.*)\)\s*\:\s*([a-zA-Z0-9\[\]\_]+))");

    std::smatch match;

    if (!std::regex_search(sig.begin(), sig.end(), match, regexp))
    {
        throw utils::Exception(R"(invalid function signature: "%s")", sig.c_str());
    }

    m_name = match[1];
    std::string args = match[2];
    m_retType = match[3];

    parseArgumentList(args);
}

void TsMethodSignature::parseArgumentList(const std::string& args)
{
    std::regex regexp(
        R"(((\.\.\.)?[a-zA-Z0-9_]+\s*\:\s*)((\([^)]+\)\s*=>\s[a-zA-Z0-9\[\]\_]+)|((readonly)?\s*[a-zA-Z0-9\[\]\_]+)))");

    std::vector<std::string> tokens;

    auto _begin = std::sregex_iterator(args.begin(), args.end(), regexp);
    auto _end = std::sregex_iterator();

    for (auto it = _begin; it != _end; ++it)
    {
        std::string arg = (*it).str();
        parseArgument(arg);
    }
}

void TsMethodSignature::parseArgument(const std::string& arg)
{
    std::regex regexp(R"((\.\.\.)?([a-zA-Z0-9_]+)\s*\:\s*((\([^)]+\)\s*=>\s*[a-zA-Z0-9\_]+)|([a-zA-Z0-9\_]+)))");
    std::smatch match;

    if (!std::regex_search(arg.begin(), arg.end(), match, regexp))
    {
        throw utils::Exception(R"(invalid argument signature: "%s")", arg.c_str());
    }

    std::string dots = match[1];
    std::string name = match[2];
    std::string type = match[3];

    m_arguments.push_back({name, type, (dots == "...") ? true : false});
}

TsMethodSignature::TsMethodSignature(const std::string& sig)
{
    parseFunction(sig);
}

std::string TsMethodSignature::name() const
{
    return m_name;
}

std::string TsMethodSignature::retType() const
{
    return m_retType;
}

std::vector<TsMethodSignature::Argument> TsMethodSignature::arguments() const
{
    return m_arguments;
}

} // namespace analyzer
