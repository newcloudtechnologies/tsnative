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

#include "AbstractBlock.h"
#include "ClassDetails.h"
#include "CodeBlock.h"
#include "FieldBlock.h"
#include "GenericMethodBlock.h"
#include "MethodBlock.h"
#include "OperatorBlock.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class ClassBlock : public AbstractBlock
{
    friend class AbstractBlock;

protected:
    std::string m_extends;
    std::vector<std::string> m_implements;
    std::vector<generator::ts::field_block_t> m_fields;
    std::vector<generator::ts::method_block_t> m_methods;
    std::vector<generator::ts::generic_method_block_t> m_genericMethods;
    std::vector<generator::ts::operator_block_t> m_operators;
    std::vector<code_block_t> m_codeBlocks;
    bool m_isExport;
    bool m_isDeclare;

protected:
    std::string formatExtends() const;
    std::string formatImplements() const;

    void printHeader(generator::print::printer_t printer) const override;
    void printBody(generator::print::printer_t printer) const override;
    void printFooter(generator::print::printer_t printer) const override;

private:
    ClassBlock(const std::string& name, bool isExport, bool isDeclare);

protected:
    ClassBlock(Type type, const std::string& name, bool isExport, bool isDeclare);

public:
    void addFields(const field_list_block_t& fields);
    void addMethods(const method_list_block_t& methods);
    void addGenericMethods(const generic_method_list_block_t& methods);
    void addOperators(const operator_list_block_t& operators);
    void addExtends(const std::string& extends);
    void addImplements(const std::vector<std::string>& implements);
    void addCodeBlock(code_block_t codeBlock);
};

using class_block_t = block_t<ClassBlock>;
using const_class_block_t = block_t<const ClassBlock>;

} // namespace ts

} // namespace generator