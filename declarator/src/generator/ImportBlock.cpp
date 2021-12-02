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

#include "ImportBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

ImportBlock::ImportBlock(const std::string& entity, const std::string& path)
    : AbstractBlock(Type::IMPORT)
    , m_entity(entity)
    , m_path(path)
{
    _ASSERT(!m_entity.empty());
    _ASSERT(!m_path.empty());
}

void ImportBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string img = strprintf(R"(import { %s } from "%s")", m_entity.c_str(), m_path.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator