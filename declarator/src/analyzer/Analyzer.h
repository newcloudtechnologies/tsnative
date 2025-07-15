#pragma once

#include "TypeUtils.h"

#include "generator/AbstractBlock.h"
#include "generator/FileBlock.h"
#include "generator/ImportBlock.h"
#include "parser/AbstractItem.h"
#include "parser/Collection.h"

#include <string>
#include <utility>
#include <vector>

namespace analyzer
{

parser::const_item_list_t getSuitableItems(const parser::Collection& collection);

analyzer::TypeMapper makeTypeMapper(const parser::Collection& collection);

generator::ts::abstract_block_t analyze(parser::const_abstract_item_t item,
                                        const TypeMapper& typeMapper,
                                        const std::vector<generator::ts::import_block_t>& importBlocks,
                                        generator::ts::abstract_block_t file);

} // namespace analyzer
