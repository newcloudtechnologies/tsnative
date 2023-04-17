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

#include <gtest/gtest.h>

#include "../infrastructure/object_wrappers.h"

#include "std/private/args_to_array.h"
#include "std/tsarray.h"
#include "std/tsnumber.h"

class ArgsToArrayFixture : public test::GlobalTestAllocatorFixture
{
};

TEST_F(ArgsToArrayFixture, EmptyArray)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    EXPECT_EQ(*(aggregator.length()), 0.0);
}

TEST_F(ArgsToArrayFixture, ArrayOfSingleNonSpreadObject)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    Object obj;
    Boolean isSpread(false);
    argsToArray.addObject(&obj, &isSpread);

    EXPECT_EQ(*(aggregator.length()), 1.0);
    const std::size_t zero = 0u;
    EXPECT_TRUE(aggregator[zero]->equals(&obj)->unboxed());
}

TEST_F(ArgsToArrayFixture, ArrayOfMultipleNonSpreadObjects)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    Object obj1;
    Boolean isSpread(false);
    argsToArray.addObject(&obj1, &isSpread);

    Object obj2;
    argsToArray.addObject(&obj2, &isSpread);

    const std::size_t zero = 0u;
    const std::size_t one = 1u;

    EXPECT_EQ(*(aggregator.length()), 2.0);
    EXPECT_TRUE(aggregator[zero]->equals(&obj1)->unboxed());
    EXPECT_TRUE(aggregator[one]->equals(&obj2)->unboxed());
}

TEST_F(ArgsToArrayFixture, ArrayOfSingleSpreadObject)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    Array<Object*> arr;
    Object obj;
    arr.push(&obj);

    Boolean isSpread(true);
    argsToArray.addObject(&arr, &isSpread);

    const std::size_t zero = 0u;
    const std::size_t one = 1u;

    EXPECT_EQ(*(aggregator.length()), 1.0);
    EXPECT_TRUE(aggregator[zero]->equals(&obj)->unboxed());
}

TEST_F(ArgsToArrayFixture, MultidimensionalArray)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    Array<Object*> arr;
    Object obj;
    arr.push(&obj);

    Boolean isSpread(false);
    argsToArray.addObject(&arr, &isSpread);

    const std::size_t zero = 0u;

    EXPECT_EQ(*(aggregator.length()), 1.0);
    EXPECT_TRUE(aggregator[zero]->equals(&arr)->unboxed());
}