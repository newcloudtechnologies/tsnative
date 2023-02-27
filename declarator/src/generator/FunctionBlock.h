/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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
#include "FunctionDetails.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class FunctionBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::vector<ArgumentValue> m_arguments;
    std::vector<std::string> m_templateArguments;
    std::string m_retType;
    bool m_isExport;
    bool m_isDeclare;

protected:
    void printBody(generator::print::printer_t printer) const override;

private:
    FunctionBlock(const std::string& name, const std::string& retType, bool isExport, bool isDeclare);

public:
    void addArgument(const std::string& name, const std::string& type, bool isSpread, bool isOptional);
    void addTemplateArgument(const std::string& type);
    bool isExport() const;
    bool isDeclare() const;
};

using function_block_t = block_t<FunctionBlock>;
using const_function_block_t = block_t<const FunctionBlock>;

} // namespace ts

} // namespace generator