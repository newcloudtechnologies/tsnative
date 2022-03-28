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

#include "TsUtils.h"

#include "utils/Exception.h"

#include <regex>

namespace analyzer
{

void TsSignature::parse(const std::string& sig)
{
    std::smatch match;

    auto regex_search = [sig, &match](const std::string& pattern)
    { return std::regex_search(sig.begin(), sig.end(), match, std::regex(pattern)); };

    // method: readResponse0(fInfos: FileInfo_t): void
    if (regex_search(R"(^((get|set)\b)?(([\s]+))?([\w]+)\((.*)\)(\s*\:\s*)?([\w]+((\<(.+)\>)|(\[\]))?)?)"))
    {
        m_type = Type::METHOD;
        m_accessor = match[1];
        m_name = match[5];
        m_arguments = parseArgumentList(match[6]);
        m_retType = match[8];
    }
    // generic method: map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[]
    else if (regex_search(
                 R"(^((get|set)\b)?(([\s]+))?([\w]+)(\<(.*)\>)(\((.*)\))(\s*\:\s*)?([\w]+((\<(.+)\>)|(\[\])))?)"))
    {
        m_type = Type::GENERIC_METHOD;
        m_accessor = match[1];
        m_name = match[5];
        m_templateArguments = parseTemplateArguments(match[7]);
        m_arguments = parseArgumentList(match[9]);
        m_retType = match[11];
    }
    // function: function map(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[]
    else if (regex_search(R"(^(function\b\s*)([\w]+)(\((.*)\))(\s*\:\s*)([\w]+((\<(.+)\>)|(\[\]))?))"))
    {
        m_type = Type::FUNCTION;
        m_name = match[2];
        m_arguments = parseArgumentList(match[4]);
        m_retType = match[6];
    }
    // generic function: function map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[]
    else if (regex_search(R"(^(function\b\s*)([\w]+)(\<(.+)\>)(\((.*)\))(\s*\:\s*)([\w]+((\<(.+)\>)|(\[\]))?))"))
    {
        m_type = Type::GENERIC_FUNCTION;
        m_name = match[2];
        m_templateArguments = parseTemplateArguments(match[4]);
        m_arguments = parseArgumentList(match[6]);
        m_retType = match[8];
    }
    // computed property name: [Symbol.iterator](): ArrayIterator<T>
    else if (regex_search(R"(^(\[([\w\.]+)\])(\((.*)\))(\:\s*)([\w]+((\<(.+)\>)|(\[\]))?))"))
    {
        m_type = Type::COMPUTED_PROPERTY_NAME;
        m_name = match[2];
        m_retType = match[6];
    }
    // index signature: [index: number]: T
    else if (regex_search(R"(^(\[(.+)\])(\:\s*)([\w]+))"))
    {
        m_type = Type::INDEX_SIGNATURE;
        m_arguments = parseArgumentList(match[2]);
        m_retType = match[4];
    }
    else
    {
        throw utils::Exception(R"(unsupported signature: "%s")", sig.c_str());
    }
}

std::vector<TsSignature::Argument> TsSignature::parseArgumentList(const std::string& args)
{
    std::vector<Argument> result;

    std::regex regexp(
        R"(((\.\.\.)?[\w]+(\[\])?(\?)?\s*\:\s*)((\([^)]+\)\s*\=\>\s[\w\[\]\_]+)|((readonly\b)?\s*[\w\[\]\<\>\.]+)))");

    auto _begin = std::sregex_iterator(args.begin(), args.end(), regexp);
    auto _end = std::sregex_iterator();

    for (auto it = _begin; it != _end; ++it)
    {
        std::string arg = (*it).str();
        result.push_back(parseArgument(arg));
    }

    return result;
}

TsSignature::Argument TsSignature::parseArgument(const std::string& arg)
{
    std::regex regexp(
        R"((\.\.\.)?([\w]+)(\?)?\s*\:\s*((\([^)]+\)\s*\=\>\s*[\w\[\]]+)|((readonly\b)?\s*[\w\[\]\<\>\.]+)))");
    std::smatch match;

    if (!std::regex_search(arg.begin(), arg.end(), match, regexp))
    {
        throw utils::Exception(R"(invalid argument signature: "%s")", arg.c_str());
    }

    std::string dots = match[1];
    std::string name = match[2];
    std::string questionMark = match[3];
    std::string type = match[4];

    bool isSpread = !dots.empty() && dots == "...";
    bool isOptional = !questionMark.empty() && questionMark == "?";

    return {name, type, isSpread, isOptional};
}

std::vector<std::string> TsSignature::parseTemplateArguments(const std::string& args)
{
    std::vector<std::string> result;

    std::regex regexp(R"(([^,^\s]+))");

    auto _begin = std::sregex_iterator(args.begin(), args.end(), regexp);
    auto _end = std::sregex_iterator();

    for (auto it = _begin; it != _end; ++it)
    {
        std::string arg = (*it).str();
        result.push_back(arg);
    }

    return result;
}

TsSignature::TsSignature(const std::string& sig)
{
    parse(sig);
}

TsSignature::Type TsSignature::type() const
{
    return m_type;
}

std::string TsSignature::name() const
{
    return m_name;
}

std::string TsSignature::accessor() const
{
    return m_accessor;
}

std::string TsSignature::retType() const
{
    return m_retType;
}

std::vector<TsSignature::Argument> TsSignature::arguments() const
{
    return m_arguments;
}

std::vector<std::string> TsSignature::templateArguments() const
{
    return m_templateArguments;
}

void TsImport::parse(const std::string& sig)
{
    std::regex regexp(R"(import\s+\{\s*([\w\,\s*]+)\s*\}\s+from\s+(\"|\')([\w\/\.]+)(\"|\'))");

    std::smatch match;

    if (!std::regex_search(sig.begin(), sig.end(), match, regexp))
    {
        throw utils::Exception(R"(invalid import signature: "%s")", sig.c_str());
    }

    m_path = match[3];
    std::string entities = match[1];

    parseEntityList(entities);
}

void TsImport::parseEntityList(const std::string& sig)
{
    std::regex regexp(R"(([^,^\s]+))");

    auto begin = std::sregex_iterator(sig.begin(), sig.end(), regexp);
    auto end = std::sregex_iterator();

    for (auto it = begin; it != end; ++it)
    {
        std::string entity = (*it).str();
        m_entities.push_back(entity);
    }
}

TsImport::TsImport(const std::string& sig)
{
    parse(sig);
}

std::string TsImport::path() const
{
    return m_path;
}

std::vector<std::string> TsImport::entities() const
{
    return m_entities;
}

} // namespace analyzer
