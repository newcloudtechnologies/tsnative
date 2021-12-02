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

#include "ElementAccessExpressionBlock.h"
#include "FunctionDetails.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

ElementAccessExpressionBlock::ElementAccessExpressionBlock(const std::string& retType, bool isStatic)
    : MethodBlock("operator[]", retType, isStatic)
{
}

void ElementAccessExpressionBlock::addArgument(const std::string& name, const std::string& type, bool isSpread)
{
    if (m_arguments.empty())
    {
        m_arguments.push_back({name, type, isSpread});
    }
    else
    {
        throw utils::Exception(R"(only one parameter)");
    }
}

void ElementAccessExpressionBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string argumentList = formatArgumentList(m_arguments);
    std::string returnType = formatReturnType(m_retType);

    std::string img = strprintf(R"(%s%s[%s]%s;)",
                                !m_visibility.empty() ? (m_visibility + " ").c_str() : "",
                                m_isStatic ? "static " : "",
                                argumentList.c_str(),
                                returnType.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator
