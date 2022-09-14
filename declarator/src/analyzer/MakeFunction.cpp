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

#include "MakeFunction.h"
#include "TsUtils.h"
#include "Checkers.h"

#include "generator/FunctionBlock.h"

#include "parser/Annotation.h"

#include "global/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <algorithm>

namespace analyzer
{

void makeFunction(parser::const_function_item_t item,
                  const TypeMapper& typeMapper,
                  generator::ts::container_block_t block)
{
    using namespace global::annotations;
    using namespace generator::ts;
    using namespace utils;
    using namespace parser;
    using namespace analyzer;

    AnnotationList annotations(getAnnotations(item->decl()));

    function_block_t functionBlock;

    if (annotations.exist(TS_SIGNATURE))
    {
        TsSignature signature(annotations.values(TS_SIGNATURE).at(0));

        if (signature.type() == TsSignature::Type::FUNCTION || signature.type() == TsSignature::Type::GENERIC_FUNCTION)
        {
            FunctionChecker::check(item, signature.name());

            functionBlock = AbstractBlock::make<FunctionBlock>(signature.name(), signature.retType(), true);

            for (const auto& it : signature.arguments())
            {
                functionBlock->addArgument(it.name, it.type, it.isSpread, it.isOptional);
            }

            if (signature.type() == TsSignature::Type::GENERIC_FUNCTION)
            {
                for (const auto& it : signature.templateArguments())
                {
                    functionBlock->addTemplateArgument(it);
                }
            }
        }
        else
        {
            throw utils::Exception(
                R"(incorrect signature type: available types: [FUNCTION, GENERIC_FUNCTION];
                function: "%s", scope: "%s", signature: "%s")",
                item->name().c_str(),
                item->prefix().c_str(),
                annotations.values(TS_SIGNATURE).at(0).c_str());
        }
    }
    else
    {
        std::string name = annotations.exist(TS_NAME) ? annotations.values(TS_NAME).at(0) : item->name();

        FunctionChecker::check(item, name);

        std::string retType = annotations.exist(TS_RETURN_TYPE)
                                  ? annotations.values(TS_RETURN_TYPE).at(0)
                                  : typeMapper.convertToTSType(item->prefix(), item->returnType());

        functionBlock = AbstractBlock::make<FunctionBlock>(name, retType, true);

        for (const auto& it : item->parameters())
        {
            std::string type = typeMapper.convertToTSType(item->prefix(), it.type());

            // can't detect spread and optional parameters automatically
            functionBlock->addArgument(it.name(), type, false, false);
        }

        if (item->type() == AbstractItem::Type::FUNCTION_TEMPLATE)
        {
            auto templateItem = std::static_pointer_cast<FunctionTemplateItem const>(item);

            for (const auto& it : templateItem->templateParameters())
            {
                functionBlock->addTemplateArgument(it.name());
            }
        }
    }

    block->add(functionBlock);
}

} // namespace analyzer
