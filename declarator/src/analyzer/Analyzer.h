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
