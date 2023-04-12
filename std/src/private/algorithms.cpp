#include "std/private/algorithms.h"

#include "std/tsobject.h"

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

void visit(const Object& obj,
           std::unordered_set<const Object*>& visited,
           const std::function<void(const Object& obj)>& visiter)
{
    if (visited.count(&obj) > 0)
    {
        return;
    }

    visited.insert(&obj);
    visiter(obj);

    const auto children = obj.getChildObjects();
    for (const auto* child : children)
    {
        visit(*child, visited, visiter);
    }
}

} // namespace utils