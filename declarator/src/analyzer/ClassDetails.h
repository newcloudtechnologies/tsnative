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

#include "generator/AbstractBlock.h"
#include "generator/AbstractMethodBlock.h"
#include "generator/ClassBlock.h"
#include "generator/ClosureBlock.h"
#include "generator/ComputedPropertyNameBlock.h"
#include "generator/FieldBlock.h"
#include "generator/GenericMethodBlock.h"
#include "generator/IndexSignatureBlock.h"
#include "generator/MethodBlock.h"
#include "generator/OperatorBlock.h"

#include "parser/ClassItem.h"
#include "parser/ClassTemplateItem.h"
#include "parser/Collection.h"

#include <optional>
#include <string>
#include <vector>

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

    std::optional<parser::const_abstract_item_t> getItem(const parser::Collection& collection,
                                                         const std::string& path) const;
    std::string getType(const clang::CXXBaseSpecifier& it) const;
    std::vector<clang::CXXBaseSpecifier> getBases(const clang::CXXRecordDecl* decl) const;

    std::string getTemplateName(const std::string& actualTypeName) const;

public:
    InheritanceNode(const InheritanceNode& other);
    InheritanceNode& operator=(const InheritanceNode& other);

    static InheritanceNode make(const parser::Collection& collection, parser::const_class_item_t item);

    parser::const_class_item_t item() const;
    std::string actualTypeName() const;
    std::vector<InheritanceNode> bases() const;
};

struct ClassCollection
{
    std::vector<generator::ts::method_block_t> methods;
    std::vector<generator::ts::generic_method_block_t> generic_methods;
    std::vector<generator::ts::closure_block_t> closures;
    std::vector<generator::ts::operator_block_t> operators;
    std::vector<generator::ts::field_block_t> fields;

private:
    parser::const_class_item_t m_item;
    const parser::Collection& m_collection;
    const TypeMapper& m_typeMapper;

private:
    ClassCollection(parser::const_class_item_t item,
                    const parser::Collection& collection,
                    const TypeMapper& typeMapper);

    std::vector<parser::const_class_item_t> getBases() const;

    generator::ts::abstract_method_block_t makeMethod(const parser::MethodItem& item,
                                                      const std::string& className,
                                                      const std::string& classPrefix);

    void check() const;
    void extract();
    void extract(parser::const_class_item_t item);
    void collect(const parser::MethodItem& item);
    void generateFields();

public:
    static ClassCollection make(parser::const_class_item_t item,
                                const parser::Collection& collection,
                                const TypeMapper& typeMapper);
};

class Extends
{
private:
    static std::vector<std::string> exportedBases(parser::const_class_item_t item);

public:
    static std::string get(parser::const_class_item_t item, const TypeMapper& typeMapper);
};

} // namespace analyzer
