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

#include "IndexSignatureBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

IndexSignatureBlock::IndexSignatureBlock(const std::string& retType)
    : OperatorBlock(Type::INDEX_SIGNATURE, retType)
{
    _ASSERT(!m_retType.empty());
}

void IndexSignatureBlock::setArgument(const ArgumentValue& arg)
{
    m_argument = arg;
}

void IndexSignatureBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string returnType = formatReturnType(m_retType);

    std::string img = strprintf(R"([%s]%s;)", m_argument.toString().c_str(), returnType.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator