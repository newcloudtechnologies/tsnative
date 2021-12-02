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

#include "MakeClass.h"
#include "ClassDetails.h"

#include "generator/AbstractBlock.h"
#include "generator/ClassBlock.h"
#include "generator/Decorator.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"

#include <string>

namespace analyzer
{

void makeClass(parser::const_class_item_t item, const TypeMapper& typeMapper, generator::ts::container_block_t block)
{
    using namespace generator::ts;
    using namespace parser;

    AnnotationList annotations(getAnnotations(item->decl()));

    std::string name = (annotations.exist("TS_NAME")) ? annotations.value("TS_NAME") : item->name();

    auto classBlock = AbstractBlock::make<ClassBlock>(name, true);

    classBlock->addExtends(getExtends(item));

    for (const auto& it : getFields(item))
    {
        classBlock->addField(it);
    }

    for (const auto& it : getMethods(item, typeMapper, Collection::get()))
    {
        classBlock->addMethod(it);
    }

    for (const auto& it : getClosures(item, typeMapper, Collection::get()))
    {
        classBlock->addClosure(it);
    }

    if (item->hasVTable())
    {
        classBlock->addDecorator(Decorator::make("VTableSize", item->getVTableSize()));
    }

    if (item->hasVirtualDestructor())
    {
        classBlock->addDecorator(Decorator::make("VirtualDestructor"));
    }

    block->add(classBlock);
}

} // namespace analyzer
