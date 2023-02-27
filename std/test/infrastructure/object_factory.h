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

#include "object_wrappers.h"

#include "std/private/tsarray_std_p.h"

#include <initializer_list>

namespace test
{
class ObjectFactory
{
public:
    template <typename T>
    static Array<T> createArray(std::initializer_list<T> list)
    {
        Array<T> result;
        for (auto e : list)
        {
            result.push(e);
        }

        return result;
    }

    template <typename T>
    static DequeueBackend<T> createDequeBackend(std::initializer_list<T> list)
    {
        DequeueBackend<T> result;
        for (auto e : list)
        {
            result.push(e);
        }

        return result;
    }

    template <typename T>
    static DequeueBackend<T> createDequeBackend(const std::vector<T>& elements)
    {
        DequeueBackend<T> result;
        for (auto& e : elements)
        {
            result.push(e);
        }

        return result;
    }
};
} // namespace test
