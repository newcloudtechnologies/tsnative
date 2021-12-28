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

class InheritanceNode
{
private:
    const parser::Collection& m_collection;

    parser::const_class_item_t m_item;
    std::string m_actualTypeName; // uses for non instantiated templates
    std::vector<InheritanceNode> m_bases;
    bool m_instantiated = true; // example; Iterator<T> - false, Rect<int, double> - true, Widget - true

private:
    InheritanceNode(const parser::Collection& collection,
                    parser::const_class_item_t item,
                    const std::string& actualTypeName,
                    bool instantiated = true);

    std::optional<parser::const_abstract_item_t> getItem(const parser::Collection& collection, const std::string& path);
    std::string getType(const clang::CXXBaseSpecifier& it);
    std::vector<clang::CXXBaseSpecifier> getBases(const clang::CXXRecordDecl* decl);

    std::string getTemplateName(const std::string& actualTypeName) const;

public:
    static InheritanceNode make(const parser::Collection& collection, parser::const_class_item_t item);

    parser::const_class_item_t item() const;
    std::string actualTypeName() const;
    std::vector<InheritanceNode> bases() const;
};

std::string getExtends(parser::const_class_item_t item);

std::vector<generator::ts::field_block_t> getFields(parser::const_class_item_t item,
                                                    const analyzer::TypeMapper& typeMapper,
                                                    const parser::Collection& collection);

std::vector<generator::ts::field_block_t> getFillerFields(parser::const_class_item_t item);

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
