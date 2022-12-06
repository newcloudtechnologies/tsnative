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

#include "TypeUtils.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"
#include "parser/NamespaceItem.h"
#include "parser/VariableItem.h"

#include "global/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/PrettyPrinter.h>
#include <clang/AST/QualTypeNames.h>

#include <exception>
#include <regex>
#include <tuple>

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

        auto& collection = Collection::ref();

        std::optional<abstract_item_t> item = collection.findItem("", moduleName);
        if (item.has_value())
        {
            if ((*item)->type() == AbstractItem::Type::NAMESPACE)
            {
                namespace_item_t namespaceItem = std::static_pointer_cast<NamespaceItem>(*item);
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
    result = trimType(result);
    result = cleanSuffix(result);

    return m_table.find(result) != m_table.end();
}

std::string TypeMapper::cleanPrefix(const std::string& type) const
{
    std::string result = type;

    std::regex regexp(R"(^((const|volatile)([\s]*))?(.*)$)");
    std::smatch match;

    if (std::regex_search(type.begin(), type.end(), match, regexp))
    {
        result = match[4];
    }

    return result;
}

std::string TypeMapper::cleanSuffix(const std::string& type) const
{
    using namespace utils;

    std::string result = type;

    std::regex regexp(R"(([^\<\>\*\&]+)(\<(.+)\>)?)");
    std::smatch match;

    if (std::regex_search(type.begin(), type.end(), match, regexp))
    {
        std::string name = match[1];
        std::string templateArgs = match[3];

        result = strprintf(
            R"(%s%s)", name.c_str(), !templateArgs.empty() ? strprintf(R"(<%s>)", templateArgs.c_str()).c_str() : "");
    }

    return result;
}

std::string TypeMapper::trimType(const std::string& type) const
{
    std::string result = type;

    result.erase(std::remove_if(result.begin(), result.end(), isspace), result.end());

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
    result = trimType(result);
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

    std::string cppType = canonicalTypeToString(type);

    if (!includes(cppType))
    {
        cppType = typeToString(type);
    }

    return convertToTSType(prefix, cppType);
}

bool isPointer(const clang::QualType& type)
{
    return type.getTypePtr()->isPointerType();
}

clang::QualType removeCVPR(const clang::QualType& type)
{
    clang::QualType qt = type;
    // remove reference
    qt = qt.getNonReferenceType();

    // remove pointer
    if (!qt.getTypePtr()->getPointeeType().isNull())
    {
        qt = qt.getTypePtr()->getPointeeType();
    }

    // remove pointer (if double pointers)
    if (!qt.getTypePtr()->getPointeeType().isNull())
    {
        qt = qt.getTypePtr()->getPointeeType();
    }

    // remove qualifiers
    qt.removeLocalConst();
    qt.removeLocalVolatile();

    return qt;
}

std::string typeToString(const clang::QualType& type)
{
    clang::LangOptions lo;
    clang::PrintingPolicy pp(lo);
    pp.adjustForCPlusPlus();

    std::string result = type.getAsString(pp);
    return result;
}

std::string typeToString(const clang::QualType& type, const clang::ASTContext& context)
{
    std::string result;

    clang::LangOptions lo;
    clang::PrintingPolicy pp(lo);
    pp.adjustForCPlusPlus();

    clang::QualType qt = type;

    result = clang::TypeName::getFullyQualifiedName(qt, context, pp);

    return result;
}

std::string canonicalTypeToString(const clang::QualType& type)
{
    clang::LangOptions lo;
    clang::PrintingPolicy pp(lo);
    pp.adjustForCPlusPlus();

    std::string result = type.getCanonicalType().getAsString(pp);
    return result;
}

std::string getFullTypeName(const std::string& prefix, const std::string& name)
{
    return !prefix.empty() ? prefix + "::" + name : name;
}

std::string getPartTypeName(const std::string& full)
{
    std::string result = full;
    std::regex regexp(R"(([\w\:\<\>]+)::([\w\:\<\>]+))");
    std::smatch match;

    // A<T>::B<R>::C => C
    if (std::regex_search(full.begin(), full.end(), match, regexp))
    {
        result = match[2];
    }

    return result;
}

int getPointerSize()
{
    using namespace parser;

    // snippet variable from TS.h
    const std::string void_pointer = "__snippets__::void_pointer";

    auto& collection = Collection::ref();

    std::optional<abstract_item_t> item = collection.findItem(void_pointer);

    if (!item.has_value())
    {
        throw utils::Exception(R"(snippet %s is not found, file TS.h is not correct)", void_pointer.c_str());
    }

    if ((*item)->type() != AbstractItem::Type::VARIABLE)
    {
        throw utils::Exception(R"(%s is not a variable, file TS.h is not correct)", void_pointer.c_str());
    }

    auto varItem = std::static_pointer_cast<parser::VariableItem>(*item);
    _ASSERT(varItem);

    return varItem->size();
}

int sizeInPointers(int sizeInBytes)
{
    auto divider = [](int x, int y)
    {
        int result = x / y;
        int rest = x % y;

        return std::tuple<int, int>{result, rest};
    };

    int result = 0;

    _ASSERT(sizeInBytes > 0);

    int sizeOfPtr = getPointerSize();

    auto division = divider(sizeInBytes, sizeOfPtr);

    if (std::get<1>(division) > 0)
    {
        // round up if rest is not a zero
        result = std::get<0>(division) + 1;
    }
    else
    {
        result = std::get<0>(division);
    }

    return result;
}

} // namespace analyzer