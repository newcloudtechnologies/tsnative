#pragma once

#include "AbstractBlock.h"
#include "FunctionDetails.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class AccessModifier
{
public:
    enum Type
    {
        PRIVATE,
        PROTECTED,
        PUBLIC
    };

private:
    Type m_type = Type::PUBLIC;

public:
    AccessModifier();
    AccessModifier(Type type);
    void setType(Type type);
    Type type() const;
    std::string typeAsString() const;
};

class AbstractMethodBlock : public AbstractBlock
{
    friend class AbstractBlock;

protected:
    std::string m_retType;
    AccessModifier m_accessModifier;

protected:
    AbstractMethodBlock(Type type, const std::string& name, const std::string& retType);

public:
    virtual ~AbstractMethodBlock() = default;
    void setAccessModifier(AccessModifier accessModifier);
};

using abstract_method_block_t = block_t<AbstractMethodBlock>;
using const_abstract_method_block_t = block_t<const AbstractMethodBlock>;

} // namespace ts

} // namespace generator