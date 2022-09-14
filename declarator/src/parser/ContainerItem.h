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

    item_list_t children() const;
};

using container_item_t = item_t<ContainerItem>;
using const_container_item_t = item_t<const ContainerItem>;

} //  namespace parser
