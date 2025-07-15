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
        case AbstractBlock::Type::GENERIC_CLASS:
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
