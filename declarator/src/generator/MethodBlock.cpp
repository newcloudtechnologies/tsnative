/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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

const std::map<MethodAccessor::Type, std::string> MethodAccessor::m_table = {
    {MethodAccessor::Type::NOTHING, ""},
    {MethodAccessor::Type::GETTER, "get"},
    {MethodAccessor::Type::SETTER, "set"},
};

MethodAccessor::MethodAccessor()
{
}

MethodAccessor::MethodAccessor(Type type)
    : m_type(type)
{
}

MethodAccessor::MethodAccessor(const char* accessor)
{
    std::string type = accessor;
    auto result = std::find_if(m_table.begin(), m_table.end(), [type](const auto& it) { return it.second == type; });

    if (result == m_table.end())
    {
        throw utils::Exception(R"(incorrect accessor type: "%s")", type.c_str());
    }

    m_type = result->first;
}

MethodAccessor::MethodAccessor(const std::string& accessor)
    : MethodAccessor(accessor.c_str())
{
}

MethodAccessor::Type MethodAccessor::type() const
{
    return m_type;
}

std::string MethodAccessor::toString() const
{
    _ASSERT(m_table.find(m_type) != m_table.end());

    return m_table.at(m_type);
}

bool MethodAccessor::operator==(const MethodAccessor& rv) const
{
    return m_type == rv.m_type;
}

MethodBlock::MethodBlock()
    : AbstractMethodBlock(Type::METHOD, "constructor", "")
    , m_isConstructor(true)
    , m_isStatic(false)
{
}

MethodBlock::MethodBlock(const std::string& name, const std::string& retType, bool isStatic)
    : AbstractMethodBlock(Type::METHOD, name, retType)
    , m_isConstructor(false)
    , m_isStatic(isStatic)
{
}

MethodBlock::MethodBlock(Type type)
    : AbstractMethodBlock(type, "constructor", "")
    , m_isConstructor(true)
    , m_isStatic(false)
{
}

MethodBlock::MethodBlock(Type type, const std::string& name, const std::string& retType, bool isStatic)
    : AbstractMethodBlock(type, name, retType)
    , m_isConstructor(false)
    , m_isStatic(isStatic)
{
}

void MethodBlock::addArgument(const ArgumentValue& arg)
{
    m_arguments.push_back(arg);
}

bool MethodBlock::isConstructor() const
{
    return m_isConstructor;
}

bool MethodBlock::isStatic() const
{
    return m_isStatic;
}

void MethodBlock::setAccessor(const MethodAccessor& accessor)
{
    m_accessor = accessor;
}

MethodAccessor MethodBlock::accessor() const
{
    return m_accessor;
}

void MethodBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    if (m_retType.empty())
    {
        if (!m_isConstructor && m_accessor.type() != MethodAccessor::Type::SETTER)
        {
            throw Exception(R"(method "%s": return value missing)", name().c_str());
        }
    }

    std::string argumentList = formatArgumentList(m_arguments);
    std::string returnType = formatReturnType(m_retType);
    std::string accessor =
        m_accessor.type() != MethodAccessor::Type::NOTHING ? (m_accessor.toString() + std::string{" "}) : "";

    std::string img = strprintf(
        R"(%s%s%s%s(%s)%s;)",
        m_accessModifier.type() != AccessModifier::Type::PUBLIC ? (m_accessModifier.typeAsString() + " ").c_str() : "",
        m_isStatic ? "static " : "",
        accessor.c_str(),
        name().c_str(),
        argumentList.c_str(),
        (m_accessor == MethodAccessor::Type::SETTER) ? "" : returnType.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator