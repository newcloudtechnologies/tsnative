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