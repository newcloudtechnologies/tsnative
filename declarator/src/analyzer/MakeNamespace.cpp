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

#include "global/Annotations.h"

#include "utils/Exception.h"

namespace analyzer
{

generator::ts::namespace_block_t makeNamespace(parser::const_namespace_item_t item,
                                               generator::ts::container_block_t parentBlock)
{
    using namespace global::annotations;
    using namespace generator::ts;
    using namespace parser;

    namespace_block_t namespaceBlock;
    AnnotationList annotations(getItemAnnotations(item));

    _ASSERT(annotations.exist(TS_MODULE) || annotations.exist(TS_NAMESPACE));

    if (annotations.exist(TS_MODULE) && !annotations.exist(TS_NAMESPACE))
    {
        if (!item->prefix().empty())
        {
            throw utils::Exception(R"(module should be a root namespace "%s", %s)", item->name().c_str(), _STAMP());
        }

        namespaceBlock = AbstractBlock::make<ModuleBlock>(item->name());
    }
    else if (annotations.exist(TS_NAMESPACE) && !annotations.exist(TS_MODULE))
    {
        bool isExport = false;
        bool isDeclare = false;

        if (annotations.exist(TS_EXPORT))
        {
            isExport = true;
        }

        if (annotations.exist(TS_DECLARE))
        {
            isDeclare = true;
        }

        if (!isExport && !isDeclare)
        {
            throw utils::Exception(R"(namespace "%s" must be either TS_EXPORT or TS_DECLARE)", item->name().c_str());
        }

        namespaceBlock = AbstractBlock::make<NamespaceBlock>(item->name(), isExport, isDeclare);
    }
    else
    {
        throw utils::Exception(
            R"(namespace must be annotated completely in the same way (TS_MODULE or TS_NAMESPACE): "%s", %s)",
            item->name().c_str(),
            _STAMP());
    }

    parentBlock->add(namespaceBlock);

    return namespaceBlock;
}

} // namespace analyzer
