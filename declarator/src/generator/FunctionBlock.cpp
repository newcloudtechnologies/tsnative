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

#include "FunctionBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

FunctionBlock::FunctionBlock(const std::string& name, const std::string& retType, bool isExport, bool isDeclare)
    : AbstractBlock(Type::FUNCTION, name)
    , m_retType(retType)
    , m_isExport(isExport)
    , m_isDeclare(isDeclare)
{
    _ASSERT(!m_retType.empty());
}

void FunctionBlock::addArgument(const std::string& name, const std::string& type, bool isSpread, bool isOptional)
{
    m_arguments.push_back({name, type, isSpread, isOptional});
}

void FunctionBlock::addTemplateArgument(const std::string& type)
{
    m_templateArguments.push_back(type);
}

bool FunctionBlock::isExport() const
{
    return m_isExport;
}

bool FunctionBlock::isDeclare() const
{
    return m_isDeclare;
}

void FunctionBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string argumentList = formatArgumentList(m_arguments);
    std::string templateArgumentList = formatTemplateArgumentList(m_templateArguments);
    std::string returnType = formatReturnType(m_retType);

    std::string exportAndDeclare = m_isDeclare ? "declare " : "";
    exportAndDeclare = m_isExport ? "export " + exportAndDeclare : exportAndDeclare;

    std::string img = strprintf(R"(%s%s %s%s(%s)%s;)",
                                exportAndDeclare.c_str(),
                                "function",
                                name().c_str(),
                                !templateArgumentList.empty() ? templateArgumentList.c_str() : "",
                                argumentList.c_str(),
                                returnType.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator