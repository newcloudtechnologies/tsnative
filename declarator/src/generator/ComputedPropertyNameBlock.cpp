#include "ComputedPropertyNameBlock.h"
#include "FunctionDetails.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

ComputedPropertyNameBlock::ComputedPropertyNameBlock(const std::string& propertyName, const std::string& retType)
    : OperatorBlock(Type::COMPUTED_PROPERTY_NAME, retType)
    , m_propertyName(propertyName)
{
    _ASSERT(!m_propertyName.empty());
    _ASSERT(!m_retType.empty());
}

void ComputedPropertyNameBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string returnType = formatReturnType(m_retType);

    std::string img = strprintf(R"([%s]()%s;)", m_propertyName.c_str(), returnType.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator