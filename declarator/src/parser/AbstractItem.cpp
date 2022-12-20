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

#include "AbstractItem.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <map>

namespace parser
{

AbstractItem::AbstractItem(
    Type type, const std::string& name, const std::string& prefix, bool isLocal, bool isCompletedDecl)
    : m_type(type)
    , m_name(name)
    , m_prefix(prefix)
    , m_isLocal(isLocal)
    , m_isCompletedDecl(isCompletedDecl)
{
}

AbstractItem::Type AbstractItem::type() const
{
    return m_type;
}

std::string AbstractItem::name() const
{
    return m_name;
}

std::string AbstractItem::prefix() const
{
    return m_prefix;
}

bool AbstractItem::isLocal() const
{
    return m_isLocal;
}

void AbstractItem::setLocal(bool isLocal)
{
    m_isLocal = isLocal;
}

bool AbstractItem::isCompletedDecl() const
{
    return m_isCompletedDecl;
}

bool AbstractItem::isContainer(const_abstract_item_t item)
{
    switch (item->type())
    {
        case AbstractItem::Type::TRANSLATION_UNIT:
        case AbstractItem::Type::NAMESPACE:
        case AbstractItem::Type::CLASS:
        case AbstractItem::Type::CLASS_TEMPLATE:
        {
            return true;
        }
        default:
        {
            return false;
        }
    };
}

std::string AbstractItem::getParentName(const_abstract_item_t item)
{
    std::vector<std::string> parts = utils::split(item->prefix(), "::");

    _ASSERT(!parts.empty());

    return parts.back();
}

std::string typeToString(AbstractItem::Type type)
{
    const std::map<int, std::string> types = {
        {AbstractItem::Type::TRANSLATION_UNIT, "TranslationUnit"},
        {AbstractItem::Type::NAMESPACE, "Namespace"},
        {AbstractItem::Type::CLASS, "Class"},
        {AbstractItem::Type::CLASS_TEMPLATE, "ClassTemplate"},
        {AbstractItem::Type::CLASS_TEMPLATE_SPECIALIZATION, "ClassTemplateSpecialization"},
        {AbstractItem::Type::ENUM, "Enum"},
        {AbstractItem::Type::FUNCTION, "Function"},
        {AbstractItem::Type::FUNCTION_TEMPLATE, "FunctionTemplate"},
        {AbstractItem::Type::CODE_BLOCK, "CodeBlock"},
        {AbstractItem::Type::VARIABLE, "Variable"},
    };

    _ASSERT(types.find(type) != types.end());

    return types.at(type);
}

std::ostream& operator<<(std::ostream& os, const AbstractItem& item)
{
    std::string local = item.isLocal() ? " (local)" : "";
    std::string type = typeToString(item.type());
    os << type << " " << item.name() << local << " pfx:" << item.prefix();
    return os;
}

} //  namespace parser
