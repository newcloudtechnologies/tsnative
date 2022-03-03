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