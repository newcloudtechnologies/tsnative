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

#include "MakeCodeBlock.h"

#include "generator/AbstractBlock.h"
#include "generator/ClassBlock.h"
#include "generator/CodeBlock.h"
#include "generator/ContainerBlock.h"

#include "utils/Exception.h"

#include <string>

namespace analyzer
{

void makeCodeBlock(parser::const_code_block_item_t item,
                   const TypeMapper& typeMapper,
                   generator::ts::abstract_block_t block)
{
    using namespace generator::ts;
    using namespace parser;

    std::string code = item->code();

    auto codeBlock = AbstractBlock::make<CodeBlock>(code);

    switch (block->type())
    {
        case AbstractBlock::Type::MODULE:
        case AbstractBlock::Type::NAMESPACE:
        case AbstractBlock::Type::FILE:
        {
            auto containerBlock = std::static_pointer_cast<ContainerBlock>(block);
            containerBlock->add(codeBlock);
            break;
        }
        case AbstractBlock::Type::CLASS:
        {
            auto classBlock = std::static_pointer_cast<ClassBlock>(block);
            classBlock->addCodeBlock(codeBlock);
            break;
        }
        default:
        {
            throw utils::Exception(R"(code block "%s" couldn't be added to "%s")",
                                   item->name().c_str(),
                                   typeToString(item->type()).c_str());
            break;
        }
    }
}

} // namespace analyzer
