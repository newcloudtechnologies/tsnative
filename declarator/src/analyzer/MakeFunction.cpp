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

    auto check_overloads = [block, prefix = item->prefix()](const std::string& name)
    {
        auto children = block->children();

        auto it = std::find_if(children.begin(), children.end(), [name](const auto& it) { return it->name() == name; });

        if (it != children.end())
        {
            throw utils::Exception(
                R"(function with name "%s" is already exist in scope "%s". TypeScrips doesn't support reloading functions)",
                name.c_str(),
                prefix.c_str());
        }
    };

    AnnotationList annotations(getAnnotations(item->decl()));

    function_block_t functionBlock;

    if (annotations.exist(TS_SIGNATURE))
    {
        TsSignature signature(annotations.values(TS_SIGNATURE).at(0));

        if (signature.type() == TsSignature::Type::FUNCTION || signature.type() == TsSignature::Type::GENERIC_FUNCTION)
        {
            check_overloads(signature.name());

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

        check_overloads(name);

        std::string retType = annotations.exist(TS_RETURN_TYPE)
                                  ? annotations.values(TS_RETURN_TYPE).at(0)
                                  : actialType(item->prefix(), mapType(typeMapper, item->returnType()));

        functionBlock = AbstractBlock::make<FunctionBlock>(name, retType, true);

        for (const auto& it : item->parameters())
        {
            std::string type = actialType(item->prefix(), mapType(typeMapper, it.type()));

            // can't detect spread and optional parameters automatically
            functionBlock->addArgument(it.name(), type, false, false);
        }
    }

    block->add(functionBlock);
}

} // namespace analyzer
