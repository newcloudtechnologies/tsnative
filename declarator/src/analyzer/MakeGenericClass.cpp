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

#include "MakeGenericClass.h"
#include "ClassDetails.h"

#include "generator/AbstractBlock.h"
#include "generator/ClassBlock.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <string>
#include <vector>

namespace analyzer
{

void makeGenericClass(parser::const_class_template_item_t item,
                      const TypeMapper& typeMapper,
                      generator::ts::container_block_t block)
{
    using namespace generator::ts;
    using namespace parser;

    AnnotationList annotations(getAnnotations(item->decl()));

    auto classBlock = AbstractBlock::make<ClassBlock>(item->name(), true);

    for (const auto& it : item->templateParameters())
    {
        classBlock->addTemplateParameter({it.name(), it.isParameterPack()});
    }

    classBlock->addExtends(getExtends(item));

    for (const auto& it : getMethods(item, typeMapper, Collection::get()))
    {
        classBlock->addMethod(it);
    }

    for (const auto& it : getTemplateMethods(item, typeMapper, Collection::get()))
    {
        classBlock->addMethod(it);
    }

    for (const auto& it : getClosures(item, typeMapper, Collection::get()))
    {
        classBlock->addClosure(it);
    }

    block->add(classBlock);
}

} // namespace analyzer
