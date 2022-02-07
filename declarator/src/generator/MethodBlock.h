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
#include "FunctionDetails.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class MethodBlock : public AbstractBlock
{
    friend class AbstractBlock;

protected:
    std::vector<ArgumentValue> m_arguments;
    std::string m_retType;
    std::string m_visibility;
    std::string m_accessor;
    bool m_isConstructor;
    bool m_isStatic;

protected:
    void printBody(generator::print::printer_t printer) const override;

protected:
    MethodBlock(); // constructor
    MethodBlock(const std::string& name, const std::string& retType, bool isStatic);

public:
    virtual void addArgument(const std::string& name, const std::string& type, bool isSpread);
    bool isConstructor() const;
    bool isStatic() const;
    void setVisibility(const std::string& visibility);
    void setAccessor(const std::string& accessor);
    std::string accessor() const;
};

using method_block_t = block_t<MethodBlock>;
using const_method_block_t = block_t<const MethodBlock>;

} // namespace ts

} // namespace generator