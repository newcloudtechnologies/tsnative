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

#pragma once

#include "ContainerItem.h"

namespace parser
{

class TranslationUnitItem : public ContainerItem
{
    friend class AbstractItem;

private:
    TranslationUnitItem();
};

using transaction_unit_item_t = item_t<TranslationUnitItem>;
using const_transaction_unit_item_t = item_t<const TranslationUnitItem>;

} //  namespace parser
