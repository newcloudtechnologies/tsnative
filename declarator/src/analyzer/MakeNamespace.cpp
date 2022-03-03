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

#include "MakeNamespace.h"

#include "Annotation.h"

#include "parser/Annotation.h"

#include "generator/ModuleBlock.h"
#include "generator/NamespaceBlock.h"

#include "global/Annotations.h"

#include "utils/Exception.h"

namespace analyzer
{

void makeNamespace(parser::const_namespace_item_t item,
                   const std::vector<generator::ts::import_block_t>& importBlocks,
                   generator::ts::container_block_t block)
{
    using namespace global::annotations;
    using namespace generator::ts;
    using namespace parser;

    namespace_block_t namespaceBlock;
    AnnotationList anotations(getItemAnnotations(item));

    _ASSERT(anotations.exist(TS_MODULE) || anotations.exist(TS_NAMESPACE));

    if (anotations.exist(TS_MODULE) && !anotations.exist(TS_NAMESPACE))
    {
        if (!item->prefix().empty())
        {
            throw utils::Exception(R"(module should be a root namespace "%s", %s)", item->name().c_str(), _STAMP());
        }

        namespaceBlock = AbstractBlock::make<ModuleBlock>(item->name());

        for (const auto& it : importBlocks)
        {
            namespaceBlock->add(it);
        }
    }
    else if (anotations.exist(TS_NAMESPACE) && !anotations.exist(TS_MODULE))
    {
        namespaceBlock = AbstractBlock::make<NamespaceBlock>(item->name(), true);
    }
    else
    {
        throw utils::Exception(R"(namespace couldn't be TS_MODULE and TS_NAMESPACE at the same time: "%s", %s)",
                               item->name().c_str(),
                               _STAMP());
    }

    block->add(namespaceBlock);
}

} // namespace analyzer
