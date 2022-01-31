#include "std/private/tsstring_p.h"

#include <climits>

#include "std/gc.h"
#include "std/tsarray.h"
#include "std/tsstring.h"

StdStringBackend::StdStringBackend()
{
}

StdStringBackend::StdStringBackend(const std::string& s)
    : _string(s)
{
}

Number* StdStringBackend::length() const
{
    return GC::createHeapAllocated<Number>(_string.size());
}

String* StdStringBackend::concat(String* other) const
{
    return GC::createHeapAllocated<String>(_string + other->cpp_str());
}

Boolean* StdStringBackend::startsWith(String* other) const
{
    return startsWith(other, GC::createHeapAllocated<Number>(0.0));
}

Boolean* StdStringBackend::startsWith(String* other, Number* startIndex) const
{
    auto lengthValue = length()->unboxed();
    auto outerLengthValue = other->length()->unboxed();

    if (lengthValue == 0 && outerLengthValue == 0)
    {
        return GC::createHeapAllocated<Boolean>(true);
    }

    int index = static_cast<int>(startIndex->unboxed());

    if (outerLengthValue + index > lengthValue)
    {
        return GC::createHeapAllocated<Boolean>(false);
    }

    auto found = _string.rfind(other->cpp_str(), index);
    return GC::createHeapAllocated<Boolean>(found == index);
}

Boolean* StdStringBackend::endsWith(String* other) const
{
    if (other->length()->greaterThan(length())->unboxed())
    {
        return GC::createHeapAllocated<Boolean>(false);
    }

    return endsWith(other, length());
}

Boolean* StdStringBackend::endsWith(String* other, Number* startIndex) const
{
    auto lengthValue = length()->unboxed();
    auto outerLengthValue = other->length()->unboxed();

    if (lengthValue == 0 && outerLengthValue == 0)
    {
        return GC::createHeapAllocated<Boolean>(true);
    }

    int index = static_cast<int>(startIndex->unboxed());
    std::string s = _string;
    s.resize(index);

    if (outerLengthValue > s.length())
    {
        return GC::createHeapAllocated<Boolean>(false);
    }

    auto pos = s.length() - outerLengthValue;
    auto found = s.find(other->cpp_str(), pos);

    return GC::createHeapAllocated<Boolean>(found == s.length() - outerLengthValue);
}

Array<String*>* StdStringBackend::split(String* pattern) const
{
    auto result = GC::track(new Array<String*>());

    if (length()->unboxed() == 0)
    {
        if (pattern->length()->unboxed() > 0)
        {
            result->push(GC::createHeapAllocated<String>(""));
        }

        return result;
    }
    else
    {
        return split(pattern, GC::createHeapAllocated<Number>(-1.0));
    }

    return result;
}

Array<String*>* StdStringBackend::split(String* pattern, Number* limit) const
{
    auto result = GC::track(new Array<String*>());
    size_t prev = 0, pos = 0;

    int tokens_max = static_cast<int>(limit->unboxed());
    std::string delim = pattern->cpp_str();

    if (tokens_max == 0)
        return result;

    if (tokens_max == -1)
        tokens_max = INT_MAX;

    if (pattern->length()->unboxed() == 0)
    {
        for (const auto& ch : _string)
        {
            std::string token(1, ch);
            result->push(GC::createHeapAllocated<String>(token));

            if (--tokens_max == 0)
                break;
        }
    }
    else
    {
        if (length()->unboxed() == 0)
        {
            result->push(GC::createHeapAllocated<String>(""));
        }
        else
        {
            do
            {
                pos = _string.find(delim, prev);

                if (pos == std::string::npos)
                    pos = _string.length();

                std::string token = _string.substr(prev, pos - prev);

                if (!token.empty())
                {
                    result->push(GC::createHeapAllocated<String>(token));
                }

                prev = pos + delim.length();

                --tokens_max;
            } while (pos < _string.length() && prev < _string.length() && tokens_max > 0);
        }
    }

    return result;
}

String* StdStringBackend::slice(Number* startIndex) const
{
    int index = static_cast<int>(startIndex->unboxed());
    int length = static_cast<int>(this->length()->unboxed());

    if (index >= length)
    {
        return GC::createHeapAllocated<String>("");
    }

    if (index < 0 && abs(index) >= length)
    {
        return GC::createHeapAllocated<String>(_string);
    }

    if (index > 0)
    {
        index = index > length - 1 ? length - 1 : index;
    }
    else if (index < 0)
    {
        index = index < -length - 1 ? -length - 1 : index;
        index = length + index;
    }

    return GC::createHeapAllocated<String>(_string.substr(index));
}

String* StdStringBackend::slice(Number* startIndex, Number* endIndex) const
{
    if (startIndex->unboxed() >= endIndex->unboxed())
    {
        return GC::createHeapAllocated<String>("");
    }

    std::string s1 = slice(startIndex)->cpp_str();
    std::string s2 = slice(endIndex)->cpp_str();

    return GC::createHeapAllocated<String>(s1.substr(0, s1.find(s2)));
}

String* StdStringBackend::substring(Number* startIndex) const
{
    int index = static_cast<int>(startIndex->unboxed());

    index = index < 0 ? 0 : index;

    if (index >= length()->unboxed())
    {
        return GC::createHeapAllocated<String>("");
    }

    return GC::createHeapAllocated<String>(_string.substr(index));
}

String* StdStringBackend::substring(Number* startIndex, Number* endIndex) const
{
    int n1 = static_cast<int>(startIndex->unboxed());
    int n2 = static_cast<int>(endIndex->unboxed());

    auto normalize = [this](int index)
    {
        int length = this->length()->unboxed();

        if (index <= 0)
        {
            return 0;
        }
        else if (index >= length)
        {
            return length;
        }

        return index;
    };

    n1 = normalize(n1);
    n2 = normalize(n2);

    int start = std::min(n1, n2);
    int end = std::max(n1, n2);

    return GC::createHeapAllocated<String>(_string.substr(start, end - start));
}

String* StdStringBackend::trim() const
{
    std::string s = _string;

    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](int ch) { return !std::isspace(ch); }));

    s.erase(std::find_if(s.rbegin(), s.rend(), [](int ch) { return !std::isspace(ch); }).base(), s.end());

    return GC::createHeapAllocated<String>(s);
}

String* StdStringBackend::toLowerCase() const
{
    std::string s = _string;

    std::transform(s.begin(), s.end(), s.begin(), [](int ch) { return std::tolower(ch); });

    return GC::createHeapAllocated<String>(s);
}

String* StdStringBackend::toUpperCase() const
{
    std::string s = _string;

    std::transform(s.begin(), s.end(), s.begin(), [](int ch) { return std::toupper(ch); });

    return GC::createHeapAllocated<String>(s);
}

Boolean* StdStringBackend::includes(String* pattern) const
{
    return includes(pattern, GC::createHeapAllocated<Number>(0.0));
}

Boolean* StdStringBackend::includes(String* pattern, Number* startIndex) const
{
    if (pattern->length()->unboxed() == 0)
    {
        return GC::createHeapAllocated<Boolean>(true);
    }

    int index = static_cast<int>(startIndex->unboxed());
    return GC::createHeapAllocated<Boolean>(_string.find(pattern->cpp_str(), index) != std::string::npos);
}

Number* StdStringBackend::indexOf(String* pattern) const
{
    return indexOf(pattern, GC::createHeapAllocated<Number>(0));
}

Number* StdStringBackend::indexOf(String* pattern, Number* startIndex) const
{
    int index = static_cast<int>(startIndex->unboxed());

    if (pattern->length()->unboxed() == 0)
    {
        return index < length()->unboxed() ? startIndex : length();
    }
    else
    {
        auto found = _string.find(pattern->cpp_str(), index);

        auto idx = found != std::string::npos ? found : -1.0;
        return GC::createHeapAllocated<Number>(idx);
    }
}

Boolean* StdStringBackend::equals(String* other) const
{
    return GC::createHeapAllocated<Boolean>(_string == other->cpp_str());
}

Number* StdStringBackend::lastIndexOf(String* pattern) const
{
    return lastIndexOf(pattern, length());
}

Number* StdStringBackend::lastIndexOf(String* pattern, Number* startIndex) const
{
    int index = static_cast<int>(startIndex->unboxed());

    if (pattern->length()->unboxed() == 0)
    {
        return index < length()->unboxed() ? startIndex : length();
    }
    else
    {
        auto found = _string.rfind(pattern->cpp_str(), index);
        auto idx = found != std::string::npos ? found : -1.0;
        return GC::createHeapAllocated<Number>(idx);
    }
}

String* StdStringBackend::operator+(String* other) const
{
    return concat(other);
}

String* StdStringBackend::operator[](Number* index) const
{
    std::string character = {_string.at(static_cast<size_t>(index->unboxed()))};
    return GC::createHeapAllocated<String>(character);
}

String* StdStringBackend::operator[](size_t index) const
{
    std::string character = {_string.at(index)};
    return GC::createHeapAllocated<String>(character);
}

Boolean* StdStringBackend::toBool() const
{
    return GC::createHeapAllocated<Boolean>(_string.length() > 0);
}

std::string StdStringBackend::cpp_str() const
{
    return _string;
}
