#pragma once

#include "TypeUtils.h"

#include "generator/GenericMethodBlock.h"
#include "generator/MethodBlock.h"
#include "generator/OperatorBlock.h"

#include "parser/ClassItem.h"
#include "parser/ClassTemplateItem.h"
#include "parser/Collection.h"
#include "parser/MethodItem.h"

#include <string>
#include <vector>

namespace analyzer
{

struct ClassDetails
{
    std::string extends;
    std::vector<generator::ts::method_block_t> methods;
    std::vector<generator::ts::generic_method_block_t> generic_methods;
    std::vector<generator::ts::operator_block_t> operators;

private:
    parser::const_class_item_t m_item;
    const parser::Collection& m_collection;
    const TypeMapper& m_typeMapper;

private:
    ClassDetails(parser::const_class_item_t item, const parser::Collection& collection, const TypeMapper& typeMapper);

    std::vector<parser::const_class_item_t> getRetainedBases() const;

    generator::ts::abstract_method_block_t makeMethod(parser::const_method_item_t item,
                                                      const std::string& className,
                                                      const std::string& classPrefix);

    void generateExtends();
    void generateAllMethods();
    void generateMethods(parser::const_class_item_t item);
    void generateMethod(parser::const_method_item_t item);

public:
    static ClassDetails make(parser::const_class_item_t item,
                             const parser::Collection& collection,
                             const TypeMapper& typeMapper);

    parser::const_class_item_t item() const;
    const parser::Collection& collection() const;
};

} // namespace analyzer
