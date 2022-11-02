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

#include "Utils.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

abstract_block_t getBlock(abstract_block_t root,
                          const std::string& path,
                          std::function<abstract_block_t(container_block_t block, const std::string& name)> find)
{
    using namespace generator::ts;
    using namespace utils;

    abstract_block_t result = root;

    if (!path.empty())
    {
        std::vector<std::string> names = split(path, "::");

        _ASSERT(AbstractBlock::isContainerBlock(root));
        auto currentBlock = std::static_pointer_cast<ContainerBlock>(root);

        for (auto i = 0; i < names.size(); i++)
        {
            std::string name = names.at(i);

            auto foundBlock = find(currentBlock, name);

            if (!foundBlock)
            {
                result = nullptr;
                break;
            }

            if (i < names.size() - 1)
            {
                _ASSERT(AbstractBlock::isContainerBlock(foundBlock));
                currentBlock = std::static_pointer_cast<ContainerBlock>(foundBlock);
            }
            else
            {
                result = foundBlock;
            }
        }
    }

    return result;
}

} // namespace ts

} // namespace generator
