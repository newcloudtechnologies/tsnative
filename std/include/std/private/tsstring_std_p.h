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

#pragma once

#include "tsstring_p.h"

class StdStringBackend : public StringPrivate
{
public:
    StdStringBackend() = default;
    StdStringBackend(const std::string& s);

    ~StdStringBackend() override = default;

    int length() const override;
    std::string concat(const std::string& other) const override;

    bool startsWith(const std::string& other) const override;
    bool startsWith(const std::string& other, int startIndex) const override;

    bool endsWith(const std::string& other) const override;
    bool endsWith(const std::string& other, int startIndex) const override;

    std::vector<std::string> split(const std::string& pattern) const override;
    std::vector<std::string> split(const std::string& pattern, int limit) const override;

    std::string slice(int startIndex) const override;
    std::string slice(int startIndex, int endIndex) const override;

    std::string substring(int startIndex) const override;
    std::string substring(int startIndex, int endIndex) const override;
    std::string trim() const override;

    std::string replace(const std::string& substr, const std::string& newSubstr) const override;

    std::string toLowerCase() const override;
    std::string toUpperCase() const override;

    bool includes(const std::string& pattern) const override;
    bool includes(const std::string& pattern, int startIndex) const override;

    int indexOf(const std::string& pattern) const override;
    int indexOf(const std::string& pattern, int startIndex) const override;

    int lastIndexOf(const std::string& pattern) const override;
    int lastIndexOf(const std::string& pattern, int startIndex) const override;

    bool equals(const std::string& other) const override;

    std::string operator[](size_t index) const override;

    bool toBool() const override;

    const std::string& cpp_str() const override;

private:
    std::string _string;
};
