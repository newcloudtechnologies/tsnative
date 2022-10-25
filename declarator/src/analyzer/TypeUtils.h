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
    bool includes(const std::string& cppType) const;
    std::string cleanPrefix(const std::string& type) const;
    std::string cleanSuffix(const std::string& type) const;
    std::string trimType(const std::string& type) const;
    std::string adaptType(const std::string& prefix, const std::string& type) const;
    std::string adaptTemplate(const std::string& prefix, const std::string& type) const;
    std::string mapType(const std::string& prefix, const std::string& type) const;

public:
    TypeMapper(const std::map<std::string, std::string>& table = {});

    std::string convertToTSType(const std::string& prefix, const std::string& type) const;
    std::string convertToTSType(const std::string& prefix, const clang::QualType& type) const;
};

bool isPointer(const clang::QualType& type);
clang::QualType removeCVPR(const clang::QualType& type);
std::string typeToString(const clang::QualType& type);
std::string typeToString(const clang::QualType& type, const clang::ASTContext& context);
std::string canonicalTypeToString(const clang::QualType& type);
std::string getFullTypeName(const std::string& prefix, const std::string& name);
std::string getPartTypeName(const std::string& full);
int getPointerSize();
int sizeInPointers(int sizeInBytes);

} // namespace analyzer
