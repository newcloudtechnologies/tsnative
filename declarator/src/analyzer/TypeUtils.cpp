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

#include "parser/Annotation.h"
#include "parser/Collection.h"
#include "parser/NamespaceItem.h"

#include "global/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/PrettyPrinter.h>

#include <exception>
#include <regex>

namespace
{

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

bool getModuleName(const std::string& path, std::string& moduleName)
{
    using namespace global::annotations;
    using namespace utils;
    using namespace parser;

    bool result = false;

    std::vector<std::string> parts = split(path, "::");

    if (!parts.empty())
    {
        moduleName = parts.at(0);

        auto& collection = Collection::get();

        if (collection.existItem("", moduleName))
        {
            item_list_t items = collection.getItems(moduleName);
            _ASSERT(items.size() == 1);

            abstract_item_t item = items.at(0);

            if (item->type() == AbstractItem::Type::NAMESPACE)
            {
                namespace_item_t namespaceItem = std::static_pointer_cast<NamespaceItem>(item);
                AnnotationList annotations(getAnnotations(namespaceItem->decl()));

                if (annotations.exist(TS_MODULE))
                {
                    result = true;
                }
            }
        }
    }

    return result;
}

bool isTheSameModule(const std::string& path1, const std::string& path2)
{
    std::string moduleName1, moduleName2;
    return getModuleName(path1, moduleName1) && getModuleName(path2, moduleName2) && moduleName1 == moduleName2;
}

} //  namespace

namespace analyzer
{

TypeMapper::TypeMapper(const std::map<std::string, std::string>& table)
{
    m_table.insert(STD_TABLE.begin(), STD_TABLE.end());
    m_table.insert(table.begin(), table.end());
}

bool TypeMapper::includes(const std::string& cppType) const
{
    std::string result = cppType;

    result = cleanPrefix(result);
    result = cleanSuffix(result);

    return m_table.find(result) != m_table.end();
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
        auto found = type.rfind(it);

        if (found != std::string::npos)
        {
            result = type.substr(0, found);
            utils::trim(result);
            break;
        }
    }

    return result;
}

//
//  collapse type if necessary and remove module name from path
//
std::string TypeMapper::adaptType(const std::string& prefix, const std::string& type) const
{
    using namespace utils;

    std::string result;

    if (isTheSameModule(type, prefix))
    {
        result = collapseType(prefix, type);
    }
    else
    {
        std::vector<std::string> parts = split(type, "::");

        std::string moduleName;
        if (getModuleName(type, moduleName))
        {
            _ASSERT(parts.at(0) == moduleName);

            // remove module name from path
            parts.erase(parts.begin());
        }

        result = join(parts, ".");
    }

    return result;
}

//
//  recursively parse template and map type, adapt type for each argument
//
std::string TypeMapper::adaptTemplate(const std::string& prefix, const std::string& type) const
{
    using namespace utils;

    auto isTemplate = [](const std::string& expr) -> bool
    {
        std::regex regexp(R"(([\w]*)\<(.+)\>)");
        return std::regex_match(expr, regexp);
    };

    auto parse = [](const std::string& expr, std::string& name, std::vector<std::string>& args)
    {
        using namespace utils;

        std::regex regexp(R"(([\w]*)\<(.+)\>)"); // example: Tuple<K, V>
        std::smatch match;

        if (!std::regex_search(expr.begin(), expr.end(), match, regexp))
        {
            throw Exception(R"(invalid template signature: "%s")", expr.c_str());
        }

        name = match[1];
        std::string sArgs = match[2];

        regexp = R"((([\w^:]+)\<(.+)\>)|([\w^:]+))"; // example: K, V
        auto _begin = std::sregex_iterator(sArgs.begin(), sArgs.end(), regexp);
        auto _end = std::sregex_iterator();

        for (auto it = _begin; it != _end; ++it)
        {
            std::string arg = (*it).str();
            args.push_back(arg);
        }
    };

    std::string result = type;

    if (isTemplate(type))
    {
        std::string name;
        std::vector<std::string> argsList;
        parse(type, name, argsList);

        for (auto& it : argsList)
        {
            it = mapType(prefix, it);
            it = adaptType(prefix, it);
            it = adaptTemplate(prefix, it);
        }

        std::string args = join(argsList, ", ");
        result = strprintf(R"(%s<%s>)", name.c_str(), args.c_str());
    }

    return result;
}

//
//  get TS type from table by cpp type
//
std::string TypeMapper::mapType(const std::string& prefix, const std::string& type) const
{
    std::string result = type;

    result = cleanPrefix(result);
    result = cleanSuffix(result);

    if (m_table.find(result) != m_table.end())
        result = m_table.at(result);

    if (result != "--")
    {
        result = adaptTemplate(prefix, result);
    }
    else
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
            R"(type "%s" is not supported, available types: [%s])", type.c_str(), availableTypes.c_str()));
    }

    return result;
}

std::string TypeMapper::convertToTSType(const std::string& prefix, const std::string& type) const
{
    std::string result;

    result = mapType(prefix, type);
    result = adaptType(prefix, result);

    return result;
}

std::string TypeMapper::convertToTSType(const std::string& prefix, const clang::QualType& type) const
{
    using namespace utils;

    clang::LangOptions lo;
    clang::PrintingPolicy pp(lo);
    pp.adjustForCPlusPlus();

    std::string result;

    std::string cppType = type.getCanonicalType().getAsString(pp);

    if (!includes(cppType))
    {
        cppType = type.getAsString(pp);
    }

    return convertToTSType(prefix, cppType);
}

} // namespace analyzer