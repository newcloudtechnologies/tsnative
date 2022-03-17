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

#include "global/Annotations.h"

#include "utils/Exception.h"

#include <string>

namespace analyzer
{

void makeClass(parser::const_class_item_t item, const TypeMapper& typeMapper, generator::ts::container_block_t block)
{
    using namespace global::annotations;
    using namespace generator::ts;
    using namespace parser;
    using namespace utils;

    auto classCollection = ClassCollection::make(item, Collection::get(), typeMapper);

    AnnotationList annotations(getAnnotations(item->decl()));

    std::string name = (annotations.exist(TS_NAME)) ? annotations.values(TS_NAME).at(0) : item->name();

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
        throw utils::Exception(R"(class "%s" must be either TS_EXPORT or TS_DECLARE)", item->name().c_str());
    }

    auto classBlock = AbstractBlock::make<ClassBlock>(name, isExport, isDeclare);

    classBlock->addExtends(Extends::get(item));

    classBlock->addFields(classCollection.fields);
    classBlock->addMethods(classCollection.methods);
    classBlock->addGenericMethods(classCollection.generic_methods);
    classBlock->addClosures(classCollection.closures);
    classBlock->addOperators(classCollection.operators);

    if (annotations.exist(TS_DECORATOR))
    {
        for (const auto& it : annotations.values(TS_DECORATOR))
        {
            decorator_t decorator = Decorator::fromString(it);
            classBlock->addDecorator(decorator);
        }
    }

    if (item->hasVTable())
    {
        classBlock->addDecorator(Decorator::make("VTableSize", item->getVTableSize()));
    }

    if (item->hasVirtualDestructor())
    {
        classBlock->addDecorator(Decorator::make("VirtualDestructor"));
    }

    if (annotations.exist(TS_IGNORE))
    {
        classBlock->setIgnore();
    }

    block->add(classBlock);
}

} // namespace analyzer
