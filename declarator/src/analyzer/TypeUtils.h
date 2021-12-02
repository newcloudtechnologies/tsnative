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

std::string collapseType(const std::string& currentPrefix, const std::string& type);

} // namespace analyzer
