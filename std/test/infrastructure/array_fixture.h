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

#include "../infrastructure/object_wrappers.h"
#include "std/tsarray.h"

#include <gtest/gtest.h>
#include <vector>

class ArrayFixture : public test::GlobalTestAllocatorFixture
{
public:
    auto* getEmptyNumberArray() const
    {
        auto* numbers = new test::Array<test::Number*>();
        return numbers;
    }

    auto* getFilledNumberArray() const
    {
        auto* numbers = new test::Array<test::Number*>();
        numbers->push(new test::Number(10));
        numbers->push(new test::Number(20));
        numbers->push(new test::Number(30));
        numbers->push(new test::Number(40));
        return numbers;
    }

    template <typename R, template <typename> class A, typename T>
    std::vector<R> toVector(const A<T*>* array) const
    {
        std::vector<R> result;

        for (const auto& it : array->toStdVector())
        {
            result.push_back(static_cast<R>(it->unboxed()));
        }

        return result;
    }
};
