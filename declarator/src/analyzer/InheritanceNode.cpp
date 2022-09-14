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

#include "InheritanceNode.h"
#include "TypeUtils.h"

#include "parser/ClassTemplateItem.h"
#include "parser/ClassTemplateSpecializationItem.h"
#include "parser/Utils.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/PrettyPrinter.h>

#include <regex>

namespace analyzer
{

InheritanceNode::InheritanceNode(const parser::Collection& collection,
                                 parser::const_class_item_t item,
                                 const std::string& actualTypeName,
                                 bool instantiated)
    : m_item(item)
    , m_actualTypeName(actualTypeName)
    , m_instantiated(instantiated)
{
    using namespace parser;

    for (const auto& it : getBases(item))
    {
        clang::QualType type = it.getTypeSourceInfo()->getType();
        std::string currentActualTypeName = typeToString(type, item->decl()->getASTContext());

        bool isInstantiated = true;

        // try: my::namespace::MyClass
        auto base_item = getItem(collection, currentActualTypeName);

        if (!base_item)
        {
            // try: my::namespace::MyClass<T> -> my::namespace::MyClass
            // my::namespace::MyClass is name of template (not a class)
            base_item = getItem(collection, getTemplateName(currentActualTypeName));

            if (!base_item)
            {
                throw utils::Exception(R"(item is not found: "%s")", currentActualTypeName.c_str());
            }

            _ASSERT(base_item && (*base_item)->type() == AbstractItem::CLASS_TEMPLATE);

            isInstantiated = false;
        }

        const_class_item_t baseClassItem = std::static_pointer_cast<const ClassItem>(*base_item);

        m_bases.push_back(
            InheritanceNode{collection, baseClassItem, getPartTypeName(currentActualTypeName), isInstantiated});
    }
}

InheritanceNode::InheritanceNode(const InheritanceNode& other)
    : m_item(other.m_item)
    , m_actualTypeName(other.m_actualTypeName)
    , m_bases(other.m_bases.begin(), other.m_bases.end())
    , m_instantiated(other.m_instantiated)
{
}

InheritanceNode& InheritanceNode::operator=(const InheritanceNode& other)
{
    if (&other != this)
    {
        m_item = other.m_item;
        m_actualTypeName = other.m_actualTypeName;
        m_bases.assign(other.m_bases.begin(), other.m_bases.end());
        m_instantiated = other.m_instantiated;
    }

    return *this;
}

std::optional<parser::const_abstract_item_t> InheritanceNode::getItem(const parser::Collection& collection,
                                                                      const std::string& path) const
{
    std::optional<parser::const_abstract_item_t> result;
    parser::const_item_list_t items;

    if (collection.exists(path))
    {
        result = collection.get(path);
    }

    return result;
}

std::string InheritanceNode::getType(const clang::CXXBaseSpecifier& it) const
{
    clang::LangOptions lo;
    clang::PrintingPolicy pp(lo);
    pp.adjustForCPlusPlus();

    std::string type = it.getTypeSourceInfo()->getType().getAsString(pp);
    return type;
}

std::vector<clang::CXXBaseSpecifier> InheritanceNode::getBases(parser::const_class_item_t item) const
{
    using namespace parser;

    std::vector<clang::CXXBaseSpecifier> result;

    auto get_bases_from_class = [&result](const clang::CXXRecordDecl* classDecl)
    {
        if (classDecl && classDecl->hasDefinition())
        {
            auto bases = classDecl->bases();

            for (const auto& it : bases)
            {
                result.push_back(it);
            }
        }
    };

    auto get_bases_from_templated_class = [get_bases_from_class](const clang::ClassTemplateDecl* classTemplateDecl)
    {
        const auto* templatedClassDecl = classTemplateDecl->getTemplatedDecl();

        _ASSERT(templatedClassDecl);

        get_bases_from_class(templatedClassDecl);
    };

    switch (item->type())
    {
        case AbstractItem::Type::CLASS:
        {
            get_bases_from_class(item->decl());
            break;
        }
        case AbstractItem::Type::CLASS_TEMPLATE:
        {
            auto classTemplateItem = std::static_pointer_cast<ClassTemplateItem const>(item);

            get_bases_from_templated_class(classTemplateItem->decl());
            break;
        }
        case AbstractItem::Type::CLASS_TEMPLATE_SPECIALIZATION:
        {
            auto classTemplateSpecializationItem =
                std::static_pointer_cast<ClassTemplateSpecializationItem const>(item);

            const auto* classTemplateDecl = classTemplateSpecializationItem->decl()->getSpecializedTemplate();
            _ASSERT(classTemplateDecl);

            get_bases_from_templated_class(classTemplateDecl);
            break;
        }
        default:
        {
            throw utils::Exception(
                R"(item should be a class, class template, or class template specialization. Item type: "%s")",
                typeToString(item->type()).c_str());
        }
    };

    return result;
}

std::string InheritanceNode::getTemplateName(const std::string& actualTypeName) const
{
    auto untemplatize = [](const std::string& fullName, std::string& templateName)
    {
        std::regex regexp(R"(^([\w]+)(\<(.+)\>)?$)");
        std::smatch match;

        bool result = std::regex_search(fullName.begin(), fullName.end(), match, regexp);

        if (result)
        {
            templateName = match[1];
        }

        return result;
    };

    auto isTemplate = [untemplatize](const std::string& name)
    {
        std::string templateName;
        return untemplatize(name, templateName) && templateName != name;
    };

    std::string result;

    std::vector<std::string> parts = parser::splitPath(actualTypeName);

    if (parts.empty())
    {
        return result;
    }
    else
    {
        // mgt::ts::Widget<T> -> mgt, ts + Widget<T>
        std::string lastPart = parts.back();
        parts.pop_back();

        // check all path's parts except last: mgt, ts
        for (const auto& it : parts)
        {
            if (isTemplate(it))
            {
                throw utils::Exception(
                    R"(invalid class name: "%s", part: "%s": %s)", actualTypeName.c_str(), it.c_str(), _STAMP());
            }
        }

        // Widget<T> -> Widget
        if (!untemplatize(lastPart, lastPart))
        {
            throw utils::Exception(
                R"(invalid class name: "%s", part: "%s": %s)", actualTypeName.c_str(), lastPart.c_str(), _STAMP());
        }

        parts.push_back(lastPart);

        // mgt, ts, Widget -> mgt::ts::Widget
        result = utils::join(parts, "::");
    }

    return result;
}

InheritanceNode InheritanceNode::make(const parser::Collection& collection, parser::const_class_item_t item)
{
    InheritanceNode node(collection, item, item->name());

    return node;
}

parser::const_class_item_t InheritanceNode::item() const
{
    return m_item;
}

std::string InheritanceNode::actualTypeName() const
{
    return m_actualTypeName;
}

std::string InheritanceNode::fullActualTypeName() const
{
    return getFullTypeName(m_item->prefix(), m_actualTypeName);
}

std::vector<InheritanceNode> InheritanceNode::bases() const
{
    return m_bases;
}

} // namespace analyzer
