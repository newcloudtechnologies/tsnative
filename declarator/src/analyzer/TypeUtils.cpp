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

#include "TypeUtils.h"

#include "utils/Strings.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/PrettyPrinter.h>

#include <exception>

namespace analyzer
{

TypeMapper::TypeMapper(const std::map<std::string, std::string>& table)
{
    m_table.insert(STD_TABLE.begin(), STD_TABLE.end());
    m_table.insert(table.begin(), table.end());
}

std::string TypeMapper::cleanPrefix(const std::string& type) const
{
    std::string result = type;

    for (const auto& it : {"volatile", "const"})
    {
        auto found = type.find(it);

        if (found != std::string::npos)
        {
            result = type.substr(std::string(it).length());
            utils::trim(result);
            break;
        }
    }

    return result;
}

std::string TypeMapper::cleanSuffix(const std::string& type) const
{
    std::string result = type;

    for (const auto& it : {"**", "&&", "*", "&"})
    {
        auto found = type.find_last_of(it);

        if (found != std::string::npos)
        {
            result = type.substr(0, found);
            utils::trim(result);
            break;
        }
    }

    return result;
}

std::string TypeMapper::getTSType(const std::string& cppType) const
{
    std::string result = cppType;

    result = cleanPrefix(result);
    result = cleanSuffix(result);

    if (m_table.find(result) != m_table.end())
        result = m_table.at(result);

    if (result == "--")
    {
        std::string availableTypes;
        for (const auto& it : STD_TABLE)
        {
            if (it.second != "--")
            {
                if (availableTypes.empty())
                {
                    availableTypes += it.first;
                }
                else
                {
                    availableTypes += (", " + it.first);
                }
            }
        }

        throw std::runtime_error(utils::strprintf(
            R"(type "%s" is not supported, available types: [%s])", cppType.c_str(), availableTypes.c_str()));
    }

    return result;
}

bool TypeMapper::inTable(const std::string& cppType) const
{
    std::string result = cppType;

    result = cleanPrefix(result);
    result = cleanSuffix(result);

    return m_table.find(result) != m_table.end();
}

std::string mapType(const TypeMapper& typeMapper, const clang::QualType& type)
{
    using namespace utils;

    clang::LangOptions lo;
    clang::PrintingPolicy pp(lo);
    pp.adjustForCPlusPlus();

    std::string result;

    std::string cppType = type.getCanonicalType().getAsString(pp);

    if (!typeMapper.inTable(cppType))
    {
        cppType = type.getAsString(pp);
    }

    result = typeMapper.getTSType(cppType);

    return result;
}

std::string collapseType(const std::string& currentPrefix, const std::string& type)
{
    using namespace utils;

    std::vector<std::string> current_parts = split(currentPrefix, "::");
    std::vector<std::string> given_parts = split(type, "::");

    for (const auto& it : current_parts)
    {
        if (given_parts.empty())
            break;

        std::string given_part = given_parts.front();

        if (it == given_part)
        {
            given_parts.erase(given_parts.begin());
        }
    }

    return join(given_parts, ".");
}

} // namespace analyzer