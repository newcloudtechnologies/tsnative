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

#include <map>
#include <string>

#include <clang/AST/Type.h>

namespace analyzer
{

class TypeMapper
{
    const std::map<std::string, std::string> STD_TABLE = {
        {"char", "--"},
        {"wchar_t", "--"},
        {"unsigned char", "--"},
        {"int", "--"},
        {"unsigned int", "--"},
        {"short", "--"},
        {"unsigned short", "--"},
        {"long", "--"},
        {"unsigned long", "--"},
        {"long long", "--"},
        {"unsigned long long", "--"},
        {"float", "--"},
        {"double", "--"},
        {"long double", "--"},
        {"bool", "--"},
        {"void", "void"},
        {"Number", "number"},
        {"String", "string"},
        {"Boolean", "boolean"},
    };

    std::map<std::string, std::string> m_table;

private:
    std::string cleanPrefix(const std::string& type) const;
    std::string cleanSuffix(const std::string& type) const;

public:
    TypeMapper(const std::map<std::string, std::string>& table = {});

    std::string getTSType(const std::string& cppType) const;
    bool inTable(const std::string& cppType) const;
};

std::string mapType(const TypeMapper& typeMapper, const clang::QualType& type);

bool getModuleName(const std::string& path, std::string& moduleName);

bool isTheSameModule(const std::string& path1, const std::string& path2);

std::string actialType(const std::string& currentPrefix, const std::string& type);

} // namespace analyzer
