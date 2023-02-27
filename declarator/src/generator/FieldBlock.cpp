/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "FieldBlock.h"
#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

FieldBlock::FieldBlock(const std::string& name, const std::string& type, bool isPrivate)
    : AbstractBlock(Type::FIELD, name)
    , m_type(type)
    , m_isPrivate(isPrivate)
{
    _ASSERT(!m_type.empty());
}

void FieldBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img = strprintf(R"(%s%s: %s;)", m_isPrivate ? "private " : "", name().c_str(), m_type.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator