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

#pragma once

#include "AbstractBlock.h"

#include <string>

namespace generator
{

namespace ts
{

class ImportBlock : public AbstractBlock
{
    friend class AbstractBlock;

    std::string m_entity;
    std::string m_path;

protected:
    void printBody(generator::print::printer_t printer) const override;

private:
    // TODO: support multiple import
    ImportBlock(const std::string& entity, const std::string& path);
};

using import_block_t = block_t<ImportBlock>;
using const_import_block_t = block_t<const ImportBlock>;

} // namespace ts

} // namespace generator