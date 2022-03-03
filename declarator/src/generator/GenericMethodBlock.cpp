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

#include "GenericMethodBlock.h"
#include "FunctionDetails.h"

namespace generator
{

namespace ts
{

GenericMethodBlock::GenericMethodBlock()
    : MethodBlock(Type::GENERIC_METHOD)
{
}

GenericMethodBlock::GenericMethodBlock(const std::string& name, const std::string& retType, bool isStatic)
    : MethodBlock(Type::GENERIC_METHOD, name, retType, isStatic)
{
}

void GenericMethodBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string argumentList = formatArgumentList(m_arguments);
    std::string templateArgumentList = formatTemplateArgumentList(m_templateArguments);
    std::string returnType = formatReturnType(m_retType);

    std::string img = strprintf(
        R"(%s%s%s%s%s(%s)%s;)",
        m_accessModifier.type() != AccessModifier::Type::PUBLIC ? (m_accessModifier.typeAsString() + " ").c_str() : "",
        m_isStatic ? "static " : "",
        !m_accessor.empty() ? (m_accessor + " ").c_str() : "",
        name().c_str(),
        !templateArgumentList.empty() ? templateArgumentList.c_str() : "",
        argumentList.c_str(),
        returnType.c_str());

    printer->print(img);
    printer->enter();
}

void GenericMethodBlock::addTemplateArgument(const std::string& type)
{
    m_templateArguments.push_back(type);
}

} // namespace ts

} // namespace generator