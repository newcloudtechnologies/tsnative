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
