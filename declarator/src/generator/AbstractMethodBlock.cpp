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