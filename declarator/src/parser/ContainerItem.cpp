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

#include "ContainerItem.h"

#include <algorithm>

namespace parser
{

ContainerItem::ContainerItem(
    Type type, const std::string& name, const std::string& prefix, bool isLocal, bool isCompletedDecl)
    : AbstractItem(type, name, prefix, isLocal, isCompletedDecl)
{
}

void ContainerItem::addItem(abstract_item_t item)
{
    m_items.push_back(item);
}

void ContainerItem::replaceItem(abstract_item_t item, abstract_item_t new_item)
{
    auto it = std::find(m_items.begin(), m_items.end(), item);
    if (it == m_items.end())
    {
        // should not happen, but for safety reasons
        m_items.push_back(new_item);
    }
    else
    {
        *it = new_item;
    }
}

item_list_t ContainerItem::children() const
{
    return m_items;
}

} //  namespace parser
