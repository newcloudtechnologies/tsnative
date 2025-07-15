#include "Utils.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <deque>

namespace parser
{

std::vector<std::string> splitPath(std::string path)
{
    std::deque<std::string> replacements;
    int _beg = 0;
    int _end = 0;

    std::string placeholder = "<>";

    // replace ns1::ns2::Template1<X::Y::Z>::Template2<A::B::C> -> ns1::ns2::Template1<>::Template2<>
    // replacements: [<X::Y::Z>, <A::B::C>]
    while (1)
    {
        _beg = path.find("<", _beg);
        _end = path.find(">", _beg);

        if (_beg > 0 && _end > 0)
        {
            std::string part = path.substr(_beg, _end - _beg + 1);
            path.replace(_beg, part.size(), placeholder);
            replacements.push_back(part);

            _beg++;
        }
        else
        {
            break;
        }
    };

    // ns1::ns2::Template1<>::Template2<> -> [ns1, ns2, Template1<>, Template2<>]
    std::vector<std::string> parts = utils::split(path, "::");

    // parts: [ns1, ns2, Template1<X::Y::Z>, Template2<A::B::C>]
    for (auto& part : parts)
    {
        int index = part.find(placeholder);
        if (index > 0)
        {
            part.replace(index, placeholder.size(), replacements.front());
            replacements.pop_front();
        }
    }

    return parts;
}

} // namespace parser