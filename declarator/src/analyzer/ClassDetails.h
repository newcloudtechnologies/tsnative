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

#pragma once

#include "TypeUtils.h"

#include "generator/ClassBlock.h"
#include "generator/ContainerBlock.h"
#include "generator/FieldBlock.h"
#include "generator/MethodBlock.h"

#include "parser/ClassItem.h"
#include "parser/ClassTemplateItem.h"
#include "parser/Collection.h"

namespace analyzer
{

struct ClassBases
{
    std::string name;
    std::string prefix;
    std::vector<parser::const_class_item_t> items;
};

std::vector<ClassBases> getAllBases(parser::const_class_item_t item, const parser::Collection& collection);

std::string getExtends(parser::const_class_item_t item);

std::vector<generator::ts::field_block_t> getFields(parser::const_class_item_t item);

std::vector<generator::ts::method_block_t> getMethods(parser::const_class_item_t item,
                                                      const analyzer::TypeMapper& typeMapper,
                                                      const parser::Collection& collection);

std::vector<generator::ts::method_block_t> getClosures(parser::const_class_item_t item,
                                                       const analyzer::TypeMapper& typeMapper,
                                                       const parser::Collection& collection);

std::vector<generator::ts::method_block_t> getTemplateMethods(parser::const_class_template_item_t item,
                                                              const analyzer::TypeMapper& typeMapper,
                                                              const parser::Collection& collection);

} // namespace analyzer
