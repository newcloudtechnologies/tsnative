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

#include "AbstractMethodBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

AccessModifier::AccessModifier()
{
}

AccessModifier::AccessModifier(Type type)
    : m_type(type)
{
}

void AccessModifier::setType(Type type)
{
    m_type = type;
}

AccessModifier::Type AccessModifier::type() const
{
    return m_type;
}

std::string AccessModifier::typeAsString() const
{
    std::string result;

    switch (m_type)
    {
        case Type::PRIVATE:
        {
            result = "private";
            break;
        }
        case Type::PROTECTED:
        {
            result = "protected";
            break;
        }
        case Type::PUBLIC:
        {
            result = "public";
            break;
        }
    };

    return result;
}

AbstractMethodBlock::AbstractMethodBlock(Type type, const std::string& name, const std::string& retType)
    : AbstractBlock(type, name)
    , m_retType(retType)
{
}

void AbstractMethodBlock::setAccessModifier(AccessModifier accessModifier)
{
    m_accessModifier = accessModifier;
}

} // namespace ts

} // namespace generator