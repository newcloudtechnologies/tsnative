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

#include "Annotation.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/Attr.h>

#include <algorithm>

namespace
{

std::string getAnnotations(const clang::Decl* decl)
{
    std::string result;

    for (const auto& it : decl->attrs())
    {
        if (it->getKind() == clang::attr::Kind::Annotate)
        {
            const auto* annotateAttr = static_cast<const clang::AnnotateAttr*>(it);

            if (result.empty())
            {
                result = annotateAttr->getAnnotation().str();
            }
            else
            {
                result += ";" + annotateAttr->getAnnotation().str();
            }
        }
    }

    return result;
}

} //  namespace

namespace parser
{

std::string getAnnotations(const clang::CXXRecordDecl* decl)
{
    std::string result;

    result = ::getAnnotations(static_cast<const clang::Decl*>(decl));

    if (result.empty() && decl->hasDefinition())
    {
        auto* def = decl->getDefinition();
        result = ::getAnnotations(static_cast<const clang::Decl*>(def));
    }

    return result;
}

std::string getAnnotations(const clang::CXXMethodDecl* decl)
{
    return ::getAnnotations(static_cast<const clang::Decl*>(decl));
}

std::string getAnnotations(const clang::EnumDecl* decl)
{
    return ::getAnnotations(static_cast<const clang::Decl*>(decl));
}

std::string getAnnotations(const clang::FunctionDecl* decl)
{
    return ::getAnnotations(static_cast<const clang::Decl*>(decl));
}

std::string getAnnotations(const clang::ClassTemplateDecl* decl)
{
    std::string result;

    result = ::getAnnotations(static_cast<const clang::Decl*>(decl));

    if (result.empty() && decl->getTemplatedDecl())
    {
        result = ::getAnnotations(static_cast<const clang::Decl*>(decl->getTemplatedDecl()));
    }

    return result;
}

std::string getAnnotations(const clang::FunctionTemplateDecl* decl)
{
    std::string result;

    result = ::getAnnotations(static_cast<const clang::Decl*>(decl));

    if (result.empty() && decl->getTemplatedDecl())
    {
        result = ::getAnnotations(static_cast<const clang::Decl*>(decl->getTemplatedDecl()));
    }

    return result;
}

AnnotationList::AnnotationList(const std::string& annotations)
    : m_annotationList(utils::split(annotations, ";"))
{
}

int AnnotationList::find(const std::string& annotation) const
{
    auto it = std::find_if(m_annotationList.begin(),
                           m_annotationList.end(),
                           [annotation](const auto& it) { return utils::starts_with(it, annotation); });

    return it != m_annotationList.end() ? std::distance(m_annotationList.begin(), it) : -1;
}

std::vector<std::string> AnnotationList::split(const std::string& s) const
{
    const char delimiter = '=';
    const char quote = '\"';

    std::vector<std::string> parts;
    int _beg = 0;
    int _end = 0;

    if (s.empty())
        return parts;

    bool isGroup = false;

    while (_end >= 0 && _end < s.length())
    {
        for (_end = _beg; _end < s.length(); _end++)
        {
            if (s.at(_end) == quote)
            {
                isGroup = (!isGroup) ? isGroup = true : isGroup = false;
            }

            if (isGroup)
                continue;

            if (s.at(_end) == delimiter)
            {
                break;
            }
        }

        std::string part = s.substr(_beg, _end - _beg);

        parts.push_back(part);

        _beg = _end + 1;
    }

    return parts;
}

bool AnnotationList::exist(const std::string& annotation) const
{
    return find(annotation) > -1;
}

std::string AnnotationList::value(const std::string& annotation) const
{
    std::string result;
    int index = find(annotation);

    if (index < 0)
        throw utils::Exception(R"(annotation "%s" is not found)", annotation.c_str());

    std::string item = m_annotationList.at(index);

    std::vector<std::string> parts = split(item);

    if (parts.size() == 1)
    {
        result = parts.at(0);
    }
    else
    {
        _ASSERT(parts.size() == 2);
        _ASSERT(!parts.at(1).empty());
        result = parts.at(1);
    }

    // remove quotes
    result.erase(remove(result.begin(), result.end(), '\"'), result.end());

    return result;
}

} //  namespace parser
