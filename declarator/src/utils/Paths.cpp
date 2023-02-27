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

#include "Paths.h"
#include "Strings.h"

#include <algorithm>
#include <vector>

namespace utils
{

std::string cutPath(std::string path, std::size_t level)
{
    std::string result;
    std::vector<std::string> parts;
    parts.reserve(level);

    for (auto i = 0; i < level; i++)
    {
        auto found = path.find_last_of("/\\");

        if (found != std::string::npos)
        {
            parts.push_back(path.substr(found + 1));
            path = path.substr(0, found);
        }
        else
        {
            break;
        }
    }

    if (parts.size() == level)
    {
        std::reverse(parts.begin(), parts.end());
        result = join(parts, "/");
    }
    else
    {
        result = path;
    }

    return result;
}

} // namespace utils
