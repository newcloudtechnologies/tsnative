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

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <string>
#include <vector>

namespace parser
{

std::string getAnnotations(const clang::CXXRecordDecl* decl);
std::string getAnnotations(const clang::CXXMethodDecl* decl);
std::string getAnnotations(const clang::FieldDecl* decl);
std::string getAnnotations(const clang::EnumDecl* decl);
std::string getAnnotations(const clang::FunctionDecl* decl);
std::string getAnnotations(const clang::ClassTemplateDecl* decl);
std::string getAnnotations(const clang::FunctionTemplateDecl* decl);
std::string getAnnotations(const clang::NamespaceDecl* decl);

bool setAnnotations(clang::CXXRecordDecl* decl, const std::string& annotations);

class AnnotationList
{
    std::vector<std::string> m_annotationList;

private:
    int find(const std::string& annotation, int beginIndex, std::string& value) const;
    int find(const std::string& annotation) const;

    std::vector<std::string> split(const std::string& s) const;
    std::string prettify(std::string raw) const;

public:
    AnnotationList(const std::string& annotations);

    bool exist(const std::string& annotation) const;
    void add(const std::string& annotation);
    void remove(const std::string& annotation);
    std::vector<std::string> values(const std::string& annotation) const;

    std::string toString() const;
};

} //  namespace parser
