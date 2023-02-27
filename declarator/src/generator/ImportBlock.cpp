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

#include "ImportBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

ImportBlock::ImportBlock(const std::string& path, const std::vector<std::string>& entities)
    : AbstractBlock(Type::IMPORT)
    , m_path(path)
    , m_entityList(entities)
{
    _ASSERT(!m_path.empty());
}

std::string ImportBlock::path() const
{
    return m_path;
}

void ImportBlock::addEntity(const std::string& entity)
{
    m_entityList.push_back(entity);
}

void ImportBlock::printBody(generator::print::printer_t printer) const
{
    using namespace utils;

    _ASSERT(!m_entityList.empty());

    std::string img = strprintf(R"(import { %s } from "%s")", join(m_entityList).c_str(), m_path.c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts

} // namespace generator