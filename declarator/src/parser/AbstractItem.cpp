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

#include "AbstractItem.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <map>

namespace parser
{

AbstractItem::AbstractItem(Type type, const std::string& name, const std::string& prefix, bool isLocal)
    : m_type(type)
    , m_name(name)
    , m_prefix(prefix)
    , m_isLocal(isLocal)
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

bool AbstractItem::isContainer(const_abstract_item_t item)
{
    switch (item->type())
    {
        case AbstractItem::Type::TRANSLATION_UNIT:
        case AbstractItem::Type::NAMESPACE:
        case AbstractItem::Type::CLASS:
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
        {AbstractItem::Type::ENUM, "Enum"},
        {AbstractItem::Type::FUNCTION, "Function"},
        {AbstractItem::Type::FUNCTION_TEMPLATE, "FunctionTemplate"},
        {AbstractItem::Type::CODE_BLOCK, "CodeBlock"},
    };

    _ASSERT(types.find(type) != types.end());

    return types.at(type);
}

} //  namespace parser
