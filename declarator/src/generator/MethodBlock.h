#pragma once

#include "AbstractMethodBlock.h"
#include "FunctionDetails.h"

#include <map>
#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class MethodAccessor
{
public:
    enum Type
    {
        NOTHING = 0,
        GETTER,
        SETTER
    };

private:
    Type m_type = Type::NOTHING;

    static const std::map<Type, std::string> m_table;

public:
    MethodAccessor();
    MethodAccessor(const char* accessor);
    MethodAccessor(const std::string& accessor);
    MethodAccessor(Type type);

    Type type() const;
    std::string toString() const;
    bool operator==(const MethodAccessor& rv) const;
};

class MethodBlock : public AbstractMethodBlock
{
    friend class AbstractBlock;

protected:
    std::vector<ArgumentValue> m_arguments;
    MethodAccessor m_accessor;
    bool m_isConstructor;
    bool m_isStatic;

protected:
    MethodBlock(); // constructor
    MethodBlock(const std::string& name, const std::string& retType, bool isStatic);

    MethodBlock(Type type); // constructor
    MethodBlock(Type type, const std::string& name, const std::string& retType, bool isStatic);

    void printBody(generator::print::printer_t printer) const override;

public:
    void addArgument(const ArgumentValue& arg);
    bool isConstructor() const;
    bool isStatic() const;
    void setAccessor(const MethodAccessor& accessor);
    MethodAccessor accessor() const;
};

using method_block_t = block_t<MethodBlock>;
using const_method_block_t = block_t<const MethodBlock>;
using method_list_block_t = std::vector<method_block_t>;
using const_method_list_block_t = std::vector<const_method_block_t>;

} // namespace ts

} // namespace generator