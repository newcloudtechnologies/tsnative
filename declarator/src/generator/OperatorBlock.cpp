#include "OperatorBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

OperatorBlock::OperatorBlock(Type type, const std::string& retType)
    : AbstractMethodBlock(type, "", retType)
{
}

} // namespace ts

} // namespace generator