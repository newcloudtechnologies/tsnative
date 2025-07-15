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

void ContainerItem::replaceItem(const std::string& name, const std::string& prefix, abstract_item_t new_item)
{
    auto it = std::find_if(m_items.begin(),
                           m_items.end(),
                           [&name, &prefix](abstract_item_t i) { return name == i->name() && prefix == i->prefix(); });
    if (it != m_items.end())
    {
        *it = new_item;
    }
}

item_list_t ContainerItem::children() const
{
    return m_items;
}

} //  namespace parser
