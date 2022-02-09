#pragma once

#include <string>
#include <vector>

class StringPrivate
{
public:
    virtual ~StringPrivate() = default;

    virtual int length() const = 0;
    virtual std::string concat(const std::string& other) const = 0;

    virtual bool startsWith(const std::string& other) const = 0;
    virtual bool startsWith(const std::string& other, int startIndex) const = 0;

    virtual bool endsWith(const std::string& other) const = 0;
    virtual bool endsWith(const std::string& other, int startIndex) const = 0;

    virtual std::vector<std::string> split(const std::string& pattern) const = 0;
    virtual std::vector<std::string> split(const std::string& pattern, int limit) const = 0;

    virtual std::string slice(int startIndex) const = 0;
    virtual std::string slice(int startIndex, int endIndex) const = 0;

    virtual std::string substring(int startIndex) const = 0;
    virtual std::string substring(int startIndex, int endIndex) const = 0;
    virtual std::string trim() const = 0;

    virtual std::string toLowerCase() const = 0;
    virtual std::string toUpperCase() const = 0;

    virtual bool includes(const std::string& pattern) const = 0;
    virtual bool includes(const std::string& pattern, int startIndex) const = 0;

    virtual int indexOf(const std::string& pattern) const = 0;
    virtual int indexOf(const std::string& pattern, int startIndex) const = 0;

    virtual int lastIndexOf(const std::string& pattern) const = 0;
    virtual int lastIndexOf(const std::string& pattern, int startIndex) const = 0;

    virtual bool equals(const std::string& other) const = 0;

    virtual std::string operator[](size_t index) const = 0;

    virtual bool toBool() const = 0;

    virtual std::string cpp_str() const = 0;
};
