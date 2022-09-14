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

#include "ContainerItem.h"

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

item_list_t ContainerItem::children() const
{
    return m_items;
}

} //  namespace parser
