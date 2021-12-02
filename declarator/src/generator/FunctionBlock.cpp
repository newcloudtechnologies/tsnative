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

#include "FunctionBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

FunctionBlock::FunctionBlock(const std::string& name, const std::string& retType, bool isExport)
    : AbstractBlock(Type::FUNCTION, name)
    , m_retType(retType)
    , m_isExport(isExport)
{
    _ASSERT(!m_retType.empty());
}

void FunctionBlock::addArgument(const std::string& name, const std::string& type, bool isSpread)
{
    m_arguments.push_back({name, type, isSpread});
}

bool FunctionBlock::isExport() const
{
    return m_isExport;
}

void FunctionBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string argumentList = formatArgumentList(m_arguments);
    std::string returnType = formatReturnType(m_retType);

    std::string img = strprintf(R"(%s%s %s(%s)%s;)",
                                m_isExport ? "export " : "",
                                "function",
                                name().c_str(),
                                argumentList.c_str(),
                                returnType.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator