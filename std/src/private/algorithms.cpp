#include "std/private/algorithms.h"

namespace utils
{

void replaceAll(std::string& str, const std::string& substrToReplace, const std::string& replacer)
{
    size_t start_pos = 0;

    while ((start_pos = str.find(substrToReplace, start_pos)) != std::string::npos)
    {
        str.replace(start_pos, 1, replacer);
        start_pos += replacer.size();
    }
}

} // namespace utils