#pragma once

#include "AbstractItem.h"

#include <vector>

namespace parser
{

class ContainerItem : public AbstractItem
{
    item_list_t m_items;

protected:
    ContainerItem(Type type,
                  const std::string& name,
                  const std::string& prefix,
                  bool isLocal = false,
                  bool isCompletedDecl = true);

public:
    virtual ~ContainerItem() = default;

    void addItem(abstract_item_t item);
    void replaceItem(const std::string& name, const std::string& prefix, abstract_item_t new_item);

    item_list_t children() const;
};

using container_item_t = item_t<ContainerItem>;
using const_container_item_t = item_t<const ContainerItem>;

} //  namespace parser
