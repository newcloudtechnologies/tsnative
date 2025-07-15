#include "Annotation.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/Attr.h>

#include <algorithm>
#include <sstream>

namespace
{
constexpr const char* DELIMITER = R"(;;)";

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
                result += DELIMITER + annotateAttr->getAnnotation().str();
            }
        }
    }

    return result;
}

void setAnnotations(clang::Decl* decl, const std::string& annotations)
{
    clang::AttrVec attrs;

    for (const auto& it : decl->getAttrs())
    {
        if (it->getKind() != clang::attr::Kind::Annotate)
        {
            attrs.push_back(it);
        }
    }

    auto* ann = clang::AnnotateAttr::CreateImplicit(decl->getASTContext(), annotations);
    attrs.push_back(ann);

    decl->setAttrs(attrs);
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

std::string getAnnotations(const clang::FieldDecl* decl)
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

std::string getAnnotations(const clang::VarDecl* decl)
{
    return ::getAnnotations(static_cast<const clang::Decl*>(decl));
}

std::string getAnnotations(const clang::NamespaceDecl* decl)
{
    std::string result;

    result = ::getAnnotations(static_cast<const clang::Decl*>(decl));

    return result;
}

bool setAnnotations(clang::CXXRecordDecl* decl, const std::string& annotations)
{
    bool result = false;

    if (!decl->attrs().empty())
    {
        ::setAnnotations(static_cast<clang::Decl*>(decl), annotations);
        result = true;
    }
    else
    {
        if (decl->hasDefinition())
        {
            auto* def = decl->getDefinition();
            ::setAnnotations(static_cast<clang::Decl*>(def), annotations);
            result = true;
        }
    }

    return result;
}

AnnotationList::AnnotationList(const std::string& annotations)
    : m_annotationList(utils::split(annotations, DELIMITER))
{
}

int AnnotationList::findIndex(const std::string& annotation, int beginIndex, std::string& value) const
{
    int nextIndex = -1;

    if (beginIndex < 0 || beginIndex >= m_annotationList.size())
        return nextIndex;

    auto it = std::find_if(std::next(m_annotationList.begin(), beginIndex),
                           m_annotationList.end(),
                           [annotation](const auto& it) { return utils::starts_with(it, annotation); });

    if (it != m_annotationList.end())
    {
        value = *it;
        nextIndex = std::distance(m_annotationList.begin(), it);
    }

    return nextIndex;
}

int AnnotationList::findIndex(const std::string& annotation) const
{
    std::string value;

    return findIndex(annotation, 0, value);
}

std::vector<std::string> AnnotationList::split(const std::string& s) const
{
    const char delimiter = '=';
    const char quotationMark = '\"';
    size_t nQuotationMarks = std::count(s.begin(), s.end(), quotationMark);

    // it must be even
    _ASSERT((nQuotationMarks & 1) == 0);

    std::vector<std::string> parts;
    int _beg = 0;
    int _end = 0;

    if (s.empty())
        return parts;

    // needs for nested quotes
    bool isInsideQuotation = false;
    int nQuotationMarksCounter = 0;

    while (_end >= 0 && _end < s.length())
    {
        for (_end = _beg; _end < s.length(); _end++)
        {
            if (s.at(_end) == quotationMark)
            {
                isInsideQuotation = (nQuotationMarksCounter++ <= nQuotationMarks) ? true : false;
            }

            if (isInsideQuotation)
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

std::string AnnotationList::prettify(std::string raw) const
{
    // remove outer quotes
    utils::trim_if(raw, [](char ch) { return ch != '\"'; });

    // replace wrong symbols
    utils::replace_all(raw, R"(\n)", "\n");
    utils::replace_all(raw, R"(\")", "\"");

    return raw;
}

bool AnnotationList::exist(const std::string& annotation) const
{
    return findIndex(annotation) > -1;
}

void AnnotationList::add(const std::string& annotation)
{
    m_annotationList.push_back(annotation);
}

void AnnotationList::remove(const std::string& annotation)
{
    int index = findIndex(annotation);

    if (index >= 0)
    {
        m_annotationList.erase(std::next(m_annotationList.begin(), index));
    }
}

std::vector<std::string> AnnotationList::values(const std::string& annotation) const
{
    std::vector<std::string> result;

    int index = -1;
    std::string item;

    for (const auto& it : m_annotationList)
    {
        if (utils::starts_with(it, annotation))
        {
            std::vector<std::string> parts = split(it);

            std::string value;

            if (parts.size() == 1)
            {
                value = parts.at(0);
            }
            else
            {
                _ASSERT(parts.size() == 2);
                _ASSERT(!parts.at(1).empty());
                value = parts.at(1);
            }

            result.push_back(prettify(value));
        }
    }

    return result;
}

std::string AnnotationList::toString() const
{
    return utils::join(m_annotationList, DELIMITER);
}

} //  namespace parser
