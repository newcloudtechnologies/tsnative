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

#include "MethodBlock.h"
#include "FunctionDetails.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

MethodBlock::MethodBlock()
    : AbstractBlock(Type::METHOD, "constructor")
    , m_isConstructor(true)
    , m_isStatic(false)
{
}

MethodBlock::MethodBlock(const std::string& name, const std::string& retType, bool isStatic)
    : AbstractBlock(Type::METHOD, name)
    , m_retType(retType)
    , m_isConstructor(false)
    , m_isStatic(isStatic)
{
    _ASSERT(!m_retType.empty());
}

void MethodBlock::addArgument(const std::string& name, const std::string& type, bool isSpread)
{
    m_arguments.push_back({name, type, isSpread});
}

bool MethodBlock::isConstructor() const
{
    return m_isConstructor;
}

bool MethodBlock::isStatic() const
{
    return m_isStatic;
}

void MethodBlock::setVisibility(const std::string& visibility)
{
    m_visibility = visibility;
}

void MethodBlock::setAccessor(const std::string& accessor)
{
    m_accessor = accessor;
}

std::string MethodBlock::accessor() const
{
    return m_accessor;
}

void MethodBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string argumentList = formatArgumentList(m_arguments);
    std::string returnType = formatReturnType(m_retType);

    std::string img = strprintf(R"(%s%s%s%s(%s)%s;)",
                                !m_visibility.empty() ? (m_visibility + " ").c_str() : "",
                                m_isStatic ? "static " : "",
                                !m_accessor.empty() ? (m_accessor + " ").c_str() : "",
                                name().c_str(),
                                argumentList.c_str(),
                                returnType.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator