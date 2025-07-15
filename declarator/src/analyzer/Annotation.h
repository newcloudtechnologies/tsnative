#pragma once

#include "parser/AbstractItem.h"

#include <string>

namespace analyzer
{

std::string getItemAnnotations(parser::const_abstract_item_t item);

} // namespace analyzer
