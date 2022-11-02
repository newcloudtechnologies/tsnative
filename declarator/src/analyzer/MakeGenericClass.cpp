/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "MakeGenericClass.h"
#include "Checkers.h"
#include "ClassDetails.h"
#include "TypeUtils.h"

#include "generator/AbstractBlock.h"
#include "generator/GenericClassBlock.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"

#include "global/Annotations.h"

#include "utils/Exception.h"

#include <string>

namespace analyzer
{

void makeGenericClass(parser::const_class_template_item_t item,
                      const TypeMapper& typeMapper,
                      generator::ts::container_block_t block)
{
    using namespace global;
    using namespace global::annotations;
    using namespace generator::ts;
    using namespace parser;

    auto classDetails = ClassDetails::make(item, Collection::ref(), typeMapper);

    // Checking
    ClassChecker::check(classDetails.item());
    InheritanceChecker::check(classDetails.item());

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
        throw utils::Exception(R"(generic class "%s" must be either TS_EXPORT or TS_DECLARE)", item->name().c_str());
    }

    auto genericClassBlock = AbstractBlock::make<GenericClassBlock>(name, isExport, isDeclare);

    for (const auto& it : item->templateParameters())
    {
        genericClassBlock->addTemplateParameter({it.name(), it.isParameterPack()});
    }

    genericClassBlock->addExtends(classDetails.extends);
    genericClassBlock->addMethods(classDetails.methods);
    genericClassBlock->addGenericMethods(classDetails.generic_methods);
    genericClassBlock->addOperators(classDetails.operators);

    if (annotations.exist(TS_DECORATOR))
    {
        for (const auto& it : annotations.values(TS_DECORATOR))
        {
            decorator_t decorator = Decorator::fromString(it);
            genericClassBlock->addDecorator(decorator);
        }
    }

    genericClassBlock->addDecorator(Decorator::make("Size", sizeInPointers(item->size())));

    if (annotations.exist(TS_IGNORE))
    {
        genericClassBlock->setIgnore();
    }

    block->add(genericClassBlock);
}

} // namespace analyzer
