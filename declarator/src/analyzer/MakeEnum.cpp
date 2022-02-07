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

#include "MakeEnum.h"

#include "generator/EnumBlock.h"

#include "parser/Annotation.h"
#include "parser/EnumItem.h"

#include "constants/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace analyzer
{

void makeEnum(parser::const_enum_item_t item, const TypeMapper& typeMapper, generator::ts::container_block_t block)
{
    using namespace constants::annotations;
    using namespace generator::ts;
    using namespace utils;
    using namespace parser;

    AnnotationList annotations(getAnnotations(item->decl()));

    std::string name = annotations.exist(TS_NAME) ? annotations.values(TS_NAME).at(0) : item->name();

    enum_block_t enumBlock = AbstractBlock::make<EnumBlock>(name);

    for (const auto& it : item->enumerators())
    {
        enumBlock->addEnumerator(AbstractBlock::make<EnumeratorBlock>(it.name(), it.value()));
    }

    block->add(enumBlock);
}

} // namespace analyzer
