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

#pragma once

#include "AbstractBlock.h"

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class ImportBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::string m_path;
    std::vector<std::string> m_entityList;

protected:
    void printBody(generator::print::printer_t printer) const override;

private:
    ImportBlock(const std::string& path, const std::vector<std::string>& entities = {});

public:
    std::string path() const;
    void addEntity(const std::string& entity);
};

using import_block_t = block_t<ImportBlock>;
using const_import_block_t = block_t<const ImportBlock>;

} // namespace ts

} // namespace generator