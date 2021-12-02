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
#include "FieldBlock.h"
#include "MethodBlock.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class ClassBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::string m_extends;
    std::vector<std::string> m_implements;
    std::vector<TemplateParameterValue> m_templateParameters;
    std::vector<const_field_block_t> m_fields;
    std::vector<const_method_block_t> m_methods;
    std::vector<const_method_block_t> m_staticMethods;
    std::vector<const_method_block_t> m_closures;
    bool m_isExport;

private:
    std::string formatExtends() const;
    std::string formatImplements() const;
    std::string formatParameters() const;

protected:
    void printHeader(generator::print::printer_t printer) const override;
    void printBody(generator::print::printer_t printer) const override;
    void printFooter(generator::print::printer_t printer) const override;

private:
    ClassBlock(const std::string& name, bool isExport);

public:
    void addField(const_field_block_t field);
    void addMethod(const_method_block_t method);
    void addClosure(const_method_block_t closure);
    void addTemplateParameter(const TemplateParameterValue& p);
    void addExtends(const std::string& extends);
    void addImplements(const std::vector<std::string>& implements);
};

using class_block_t = block_t<ClassBlock>;
using const_class_block_t = block_t<const ClassBlock>;

} // namespace ts

} // namespace generator