#include <algorithm>
#include <limits>
#include <climits>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <iomanip>
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
string::string(double d)
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

double string::length() const
{
    return static_cast<double>(string_.size());
}

string* string::concat(const string& other) const
{
    return GC::createHeapAllocated<string>(string_ + other.string_);
}

bool string::startsWith(const string& other) const
{
    return startsWith(other, 0);
}

bool string::startsWith(const string& other, double startIndex) const
{
    int index = static_cast<int>(startIndex);
    bool result = false;

    if (length() == 0 && other.length() == 0)
    {
        result = true;
    }
    else
    {
        if (other.length() + index > length())
            return result;

        auto found = string_.rfind(other.string_, index);

        result = found == index;
    }

    return result;
}

bool string::endsWith(const string& other) const
{
    if (other.length() > length())
        return false;

    return endsWith(other, length());
}

bool string::endsWith(const string& other, double startIndex) const
{
    int index = static_cast<int>(startIndex);
    bool result = false;

    if (length() == 0 && other.length() == 0)
    {
        result = true;
    }
    else
    {
        std::string s = string_;
        s.resize(index);

        if (other.length() > s.length())
            return result;

        auto pos = s.length() - other.length();
        auto found = s.find(other.string_, pos);

        result = found == s.length() - other.length();
    }

    return result;
}

Array<string*>* string::split() const
{
    Array<string*> result;
    result.push(GC::createHeapAllocated<string>(string_));
    return GC::createHeapAllocated<Array<string*>>(result);
}

Array<string*>* string::split(const string& pattern) const
{
    Array<string*> result;

    if (length() == 0)
    {
        if (pattern.length() > 0)
        {
            result.push(GC::createHeapAllocated<string>(""));
        }

        return GC::createHeapAllocated<Array<string*>>(result);
    }
    else
    {
        return split(pattern, -1.0);
    }

    return GC::createHeapAllocated<Array<string*>>(result);
}

Array<string*>* string::split(const string& pattern, double limit) const
{
    Array<string*> result;
    size_t prev = 0, pos = 0;

    int tokens_max = static_cast<int>(limit);
    std::string delim = pattern.string_;

    if (tokens_max == 0)
        return GC::createHeapAllocated<Array<string*>>(result);

    if (tokens_max == -1)
        tokens_max = INT_MAX;

    if (pattern.length() == 0)
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
        if (length() == 0)
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

string* string::slice(double startIndex) const
{
    int index = static_cast<int>(startIndex);
    int length = static_cast<int>(this->length());

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

string* string::slice(double startIndex, double endIndex) const
{
    if (startIndex >= endIndex)
    {
        return GC::createHeapAllocated<string>("");
    }

    std::string s1 = slice(startIndex)->string_;
    std::string s2 = slice(endIndex)->string_;

    return GC::createHeapAllocated<string>(s1.substr(0, s1.find(s2)));
}

string* string::substring(double startIndex) const
{
    int index = static_cast<int>(startIndex);

    index = index < 0 ? 0 : index;

    if (index >= length())
    {
        return GC::createHeapAllocated<string>("");
    }

    return GC::createHeapAllocated<string>(string_.substr(index));
}

string* string::substring(double startIndex, double endIndex) const
{
    int n1 = static_cast<int>(startIndex);
    int n2 = static_cast<int>(endIndex);

    auto normalize = [this](int index) {
        int length = this->length();

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
    return includes(pattern, 0);
}

bool string::includes(const string& pattern, double startIndex) const
{
    int index = static_cast<int>(startIndex);

    if (pattern.length() == 0)
        return true;

    return string_.find(pattern.string_, index) != std::string::npos;
}

double string::indexOf(const string& pattern) const
{
    return indexOf(pattern, 0);
}

double string::indexOf(const string& pattern, double startIndex) const
{
    int index = static_cast<int>(startIndex);

    if (pattern.length() == 0)
    {
        return index < length() ? index : length();
    }
    else
    {
        auto found = string_.find(pattern.string_, index);

        return found != std::string::npos ? found : -1.0;
    }
}

double string::lastIndexOf(const string& pattern) const
{
    return lastIndexOf(pattern, length());
}

double string::lastIndexOf(const string& pattern, double startIndex) const
{
    int index = static_cast<int>(startIndex);

    if (pattern.length() == 0)
    {
        return index < length() ? index : length();
    }
    else
    {
        auto found = string_.rfind(pattern.string_, index);

        return found != std::string::npos ? found : -1.0;
    }
}

bool string::operator==(const string& other) const
{
    return string_ == other.string_;
}

string* string::operator+(const string& other) const
{
    return concat(other);
}

string* string::operator[](double index) const
{
    std::string character = {string_.at(static_cast<size_t>(index))};
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
