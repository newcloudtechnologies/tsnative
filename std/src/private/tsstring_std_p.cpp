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

#include "std/private/tsstring_std_p.h"

#include <algorithm>
#include <climits>

StdStringBackend::StdStringBackend(const std::string& s)
    : _string(s)
{
}

int StdStringBackend::length() const
{
    return static_cast<int>(_string.size());
}

std::string StdStringBackend::concat(const std::string& other) const
{
    return _string + other;
}

bool StdStringBackend::startsWith(const std::string& other) const
{
    return startsWith(other, 0);
}

bool StdStringBackend::startsWith(const std::string& other, int startIndex) const
{
    if (length() == 0 && other.length() == 0)
    {
        return true;
    }

    if (other.length() + startIndex > length())
    {
        return false;
    }

    auto found = _string.rfind(other, startIndex);
    return found == startIndex;
}

bool StdStringBackend::endsWith(const std::string& other) const
{
    if (other.length() > length())
    {
        return false;
    }

    return endsWith(other, length());
}

bool StdStringBackend::endsWith(const std::string& other, int startIndex) const
{
    if (length() == 0 && other.length() == 0)
    {
        return true;
    }

    std::string s = _string;
    s.resize(startIndex);

    if (other.length() > s.length())
    {
        return false;
    }

    auto pos = s.length() - other.length();
    auto found = s.find(other, pos);

    return found == s.length() - other.length();
}

std::vector<std::string> StdStringBackend::split(const std::string& pattern) const
{
    if (length() == 0)
    {
        std::vector<std::string> result;

        if (pattern.length() > 0)
        {
            result.push_back("");
        }

        return result;
    }

    return split(pattern, -1);
}

std::vector<std::string> StdStringBackend::split(const std::string& pattern, int limit) const
{
    std::vector<std::string> result;
    size_t prev = 0, pos = 0;

    int tokens_max = limit;
    std::string delim = pattern;

    if (tokens_max == 0)
        return result;

    if (tokens_max == -1)
        tokens_max = INT_MAX;

    if (pattern.length() == 0)
    {
        for (const auto& ch : _string)
        {
            std::string token(1, ch);
            result.push_back(token);

            if (--tokens_max == 0)
                break;
        }
    }
    else
    {
        if (length() == 0)
        {
            result.push_back("");
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
                    result.push_back(token);
                }

                prev = pos + delim.length();

                --tokens_max;
            } while (pos < _string.length() && prev < _string.length() && tokens_max > 0);
        }
    }

    return result;
}

std::string StdStringBackend::slice(int startIndex) const
{
    if (startIndex >= length())
    {
        return "";
    }

    if (startIndex < 0 && abs(startIndex) >= length())
    {
        return _string;
    }

    if (startIndex > 0)
    {
        startIndex = startIndex > length() - 1 ? length() - 1 : startIndex;
    }
    else if (startIndex < 0)
    {
        startIndex = startIndex < -length() - 1 ? -length() - 1 : startIndex;
        startIndex = length() + startIndex;
    }

    return _string.substr(startIndex);
}

std::string StdStringBackend::slice(int startIndex, int endIndex) const
{
    if (startIndex >= endIndex)
    {
        return "";
    }

    std::string s1 = slice(startIndex);
    std::string s2 = slice(endIndex);

    return s1.substr(0, s1.find(s2));
}

std::string StdStringBackend::substring(int startIndex) const
{
    startIndex = startIndex < 0 ? 0 : startIndex;

    if (startIndex >= length())
    {
        return "";
    }

    return _string.substr(startIndex);
}

std::string StdStringBackend::substring(int startIndex, int endIndex) const
{
    int n1 = startIndex;
    int n2 = endIndex;

    auto normalize = [this](int index)
    {
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

    return _string.substr(start, end - start);
}

std::string StdStringBackend::trim() const
{
    std::string s = _string;

    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](int ch) { return !std::isspace(ch); }));

    s.erase(std::find_if(s.rbegin(), s.rend(), [](int ch) { return !std::isspace(ch); }).base(), s.end());

    return s;
}

std::string StdStringBackend::toLowerCase() const
{

    std::string s = _string;

    std::transform(s.begin(), s.end(), s.begin(), [](int ch) { return std::tolower(ch); });

    return s;
}

std::string StdStringBackend::toUpperCase() const
{
    std::string s = _string;

    std::transform(s.begin(), s.end(), s.begin(), [](int ch) { return std::toupper(ch); });

    return s;
}

bool StdStringBackend::includes(const std::string& pattern) const
{
    return includes(pattern, 0);
}

bool StdStringBackend::includes(const std::string& pattern, int startIndex) const
{
    if (pattern.length() == 0)
    {
        return true;
    }

    return _string.find(pattern, startIndex) != std::string::npos;
}

int StdStringBackend::indexOf(const std::string& pattern) const
{
    return indexOf(pattern, 0);
}

int StdStringBackend::indexOf(const std::string& pattern, int startIndex) const
{
    if (pattern.length() == 0)
    {
        return startIndex < length() ? startIndex : length();
    }

    auto found = _string.find(pattern, startIndex);

    auto idx = found != std::string::npos ? found : -1.0;
    return idx;
}

int StdStringBackend::lastIndexOf(const std::string& pattern) const
{
    return lastIndexOf(pattern, length());
}

int StdStringBackend::lastIndexOf(const std::string& pattern, int startIndex) const
{
    if (pattern.length() == 0)
    {
        return startIndex < length() ? startIndex : length();
    }

    auto found = _string.rfind(pattern, startIndex);
    auto idx = found != std::string::npos ? found : -1.0;
    return idx;
}

bool StdStringBackend::equals(const std::string& other) const
{
    return _string == other;
}

std::string StdStringBackend::operator[](size_t index) const
{
    return {_string.at(index)};
}

bool StdStringBackend::toBool() const
{
    return _string.length() > 0;
}

const std::string& StdStringBackend::cpp_str() const
{
    return _string;
}