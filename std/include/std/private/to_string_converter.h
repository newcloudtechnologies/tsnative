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

#pragma once

#include <string>
#include <unordered_set>

class Object;

class ToStringConverter
{
public:
    static std::string convert(const Object* obj);

private:
    using Visited = std::unordered_set<const Object*>;

    static std::string convertWithCheck(const Object* obj, Visited& visited);

    template <typename O>
    static std::string toString(const O*, Visited& visited);
};