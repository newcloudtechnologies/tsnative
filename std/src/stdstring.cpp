#include <algorithm>
#include <climits>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <iomanip>
#include <limits>
#include <memory>
#include <sstream>
#include <vector>

#include "std/array.h"
#include "std/gc.h"
#include "std/stdstring.h"

#include "std/iterators/stringiterator.h"

string::string()
{
}
string::string(Number* d)
{
    std::ostringstream oss;
    oss << std::setprecision(std::numeric_limits<double>::max_digits10) << std::noshowpoint << d;
    this->string_ = oss.str();
}
string::string(const int8_t* s)
    : string_(reinterpret_cast<const char*>(s))
{
}
string::string(const std::string& s)
    : string_(s)
{
}
string::string(const char* s)
    : string_(s)
{
}

Number* string::length() const
{
    return GC::createHeapAllocated<Number>(string_.size());
}

string* string::concat(const string& other) const
{
    return GC::createHeapAllocated<string>(string_ + other.string_);
}

bool string::startsWith(const string& other) const
{
    return startsWith(other, GC::createHeapAllocated<Number>(0));
}

bool string::startsWith(const string& other, Number* startIndex) const
{
    int index = static_cast<int>(startIndex->valueOf());
    bool result = false;

    auto lengthValue = length()->valueOf();
    auto outerLengthValue = other.length()->valueOf();

    if (lengthValue == 0 && outerLengthValue == 0)
    {
        result = true;
    }
    else
    {
        if (outerLengthValue + index > lengthValue)
            return result;

        auto found = string_.rfind(other.string_, index);

        result = found == index;
    }

    return result;
}

bool string::endsWith(const string& other) const
{
    auto lengthValue = length()->valueOf();
    auto outerLengthValue = other.length()->valueOf();

    if (outerLengthValue > lengthValue)
        return false;

    return endsWith(other, length());
}

bool string::endsWith(const string& other, Number* startIndex) const
{
    int index = static_cast<int>(startIndex->valueOf());
    bool result = false;

    auto lengthValue = length()->valueOf();
    auto outerLengthValue = other.length()->valueOf();

    if (lengthValue == 0 && outerLengthValue == 0)
    {
        result = true;
    }
    else
    {
        std::string s = string_;
        s.resize(index);

        if (outerLengthValue > s.length())
            return result;

        auto pos = s.length() - outerLengthValue;
        auto found = s.find(other.string_, pos);

        result = found == s.length() - outerLengthValue;
    }

    return result;
}

Array<string*>* string::split(const string& pattern) const
{
    Array<string*> result;

    if (length()->valueOf() == 0)
    {
        if (pattern.length()->valueOf() > 0)
        {
            result.push(GC::createHeapAllocated<string>(""));
        }

        return GC::createHeapAllocated<Array<string*>>(result);
    }
    else
    {
        return split(pattern, GC::createHeapAllocated<Number>(-1.0));
    }

    return GC::createHeapAllocated<Array<string*>>(result);
}

Array<string*>* string::split(const string& pattern, Number* limit) const
{
    Array<string*> result;
    size_t prev = 0, pos = 0;

    int tokens_max = static_cast<int>(limit->valueOf());
    std::string delim = pattern.string_;

    if (tokens_max == 0)
        return GC::createHeapAllocated<Array<string*>>(result);

    if (tokens_max == -1)
        tokens_max = INT_MAX;

    if (pattern.length()->valueOf() == 0)
    {
        for (const auto& ch : string_)
        {
            std::string token(1, ch);
            result.push(GC::createHeapAllocated<string>(token));

            if (--tokens_max == 0)
                break;
        }
    }
    else
    {
        if (length()->valueOf() == 0)
        {
            result.push(GC::createHeapAllocated<string>(""));
        }
        else
        {
            do
            {
                pos = string_.find(delim, prev);

                if (pos == std::string::npos)
                    pos = string_.length();

                std::string token = string_.substr(prev, pos - prev);

                if (!token.empty())
                {
                    result.push(GC::createHeapAllocated<string>(token));
                }

                prev = pos + delim.length();

                --tokens_max;
            } while (pos < string_.length() && prev < string_.length() && tokens_max > 0);
        }
    }

    return GC::createHeapAllocated<Array<string*>>(result);
}

string* string::slice(Number* startIndex) const
{
    int index = static_cast<int>(startIndex->valueOf());
    int length = static_cast<int>(this->length()->valueOf());

    if (index >= length)
    {
        return GC::createHeapAllocated<string>("");
    }

    if (index < 0 && abs(index) >= length)
    {
        return const_cast<string*>(this);
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

    return GC::createHeapAllocated<string>(string_.substr(index));
}

string* string::slice(Number* startIndex, Number* endIndex) const
{
    if (startIndex->valueOf() >= endIndex->valueOf())
    {
        return GC::createHeapAllocated<string>("");
    }

    std::string s1 = slice(startIndex)->string_;
    std::string s2 = slice(endIndex)->string_;

    return GC::createHeapAllocated<string>(s1.substr(0, s1.find(s2)));
}

string* string::substring(Number* startIndex) const
{
    int index = static_cast<int>(startIndex->valueOf());

    index = index < 0 ? 0 : index;

    if (index >= length()->valueOf())
    {
        return GC::createHeapAllocated<string>("");
    }

    return GC::createHeapAllocated<string>(string_.substr(index));
}

string* string::substring(Number* startIndex, Number* endIndex) const
{
    int n1 = static_cast<int>(startIndex->valueOf());
    int n2 = static_cast<int>(endIndex->valueOf());

    auto normalize = [this](int index)
    {
        int length = this->length()->valueOf();

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

    return GC::createHeapAllocated<string>(string_.substr(start, end - start));
}

string* string::trim() const
{
    std::string s = string_;

    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](int ch) { return !std::isspace(ch); }));

    s.erase(std::find_if(s.rbegin(), s.rend(), [](int ch) { return !std::isspace(ch); }).base(), s.end());

    return GC::createHeapAllocated<string>(s);
}

string* string::toLowerCase() const
{
    std::string s = string_;

    std::transform(s.begin(), s.end(), s.begin(), [](int ch) { return std::tolower(ch); });

    return GC::createHeapAllocated<string>(s);
}

string* string::toUpperCase() const
{
    std::string s = string_;

    std::transform(s.begin(), s.end(), s.begin(), [](int ch) { return std::toupper(ch); });

    return GC::createHeapAllocated<string>(s);
}

bool string::includes(const string& pattern) const
{
    return includes(pattern, GC::createHeapAllocated<Number>(0));
}

bool string::includes(const string& pattern, Number* startIndex) const
{
    int index = static_cast<int>(startIndex->valueOf());

    if (pattern.length()->valueOf() == 0)
        return true;

    return string_.find(pattern.string_, index) != std::string::npos;
}

Number* string::indexOf(const string& pattern) const
{
    return indexOf(pattern, GC::createHeapAllocated<Number>(0));
}

Number* string::indexOf(const string& pattern, Number* startIndex) const
{
    int index = static_cast<int>(startIndex->valueOf());

    if (pattern.length()->valueOf() == 0)
    {
        return index < length()->valueOf() ? startIndex : length();
    }
    else
    {
        auto found = string_.find(pattern.string_, index);

        auto idx = found != std::string::npos ? found : -1.0;
        return GC::createHeapAllocated<Number>(idx);
    }
}

Number* string::lastIndexOf(const string& pattern) const
{
    return lastIndexOf(pattern, length());
}

Number* string::lastIndexOf(const string& pattern, Number* startIndex) const
{
    int index = static_cast<int>(startIndex->valueOf());

    if (pattern.length()->valueOf() == 0)
    {
        return index < length()->valueOf() ? startIndex : length();
    }
    else
    {
        auto found = string_.rfind(pattern.string_, index);
        auto idx = found != std::string::npos ? found : -1.0;
        return GC::createHeapAllocated<Number>(idx);
    }
}

bool string::operator==(string* other) const
{
    return string_ == other->string_;
}

bool string::operator==(const string& other) const
{
    return string_ == other.string_;
}

string* string::operator+(const string& other) const
{
    return concat(other);
}

string* string::operator[](Number* index) const
{
    std::string character = {string_.at(static_cast<size_t>(index->valueOf()))};
    return GC::createHeapAllocated<string>(character);
}

IterableIterator<string*>* string::iterator()
{
    auto it = new StringIterator<string*>(this);
    return GC::track(it);
}

std::string string::cpp_str() const
{
    return string_;
}

template class Array<string*>;
template class IteratorResult<string*>;
