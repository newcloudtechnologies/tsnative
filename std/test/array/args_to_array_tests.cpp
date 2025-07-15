#include <gtest/gtest.h>

#include "std/tsarray.h"
#include "std/tsnumber.h"
#include "std/tstuple.h"

#include "std/private/args_to_array.h"

TEST(ArgsToArrayFixture, EmptyArray)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    EXPECT_EQ(*(aggregator.length()), 0.0);
}

TEST(ArgsToArrayFixture, ArrayOfSingleNonSpreadObject)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    Object obj;
    Boolean isSpread(false);
    argsToArray.addObject(&obj, &isSpread);

    const std::size_t zero = 0u;

    EXPECT_EQ(*(aggregator.length()), 1.0);
    EXPECT_TRUE(aggregator[zero]->equals(&obj)->unboxed());
}

TEST(ArgsToArrayFixture, ArrayOfMultipleNonSpreadObjects)
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

TEST(ArgsToArrayFixture, ArrayOfSingleSpreadObject)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    Array<Object*> arr;
    Object obj1;
    Object obj2;
    Object obj3;
    arr.push(&obj1);
    arr.push(&obj2);
    arr.push(&obj3);

    Boolean isSpread(true);
    argsToArray.addObject(&arr, &isSpread);

    const std::size_t zero = 0u;
    const std::size_t one = 1u;
    const std::size_t two = 2u;

    EXPECT_EQ(*(aggregator.length()), 3.0);
    EXPECT_TRUE(aggregator[zero]->equals(&obj1)->unboxed());
    EXPECT_TRUE(aggregator[one]->equals(&obj2)->unboxed());
    EXPECT_TRUE(aggregator[two]->equals(&obj3)->unboxed());
}

TEST(ArgsToArrayFixture, ArraySpreadTuple)
{
    Array<Object*> aggregator;
    ArgsToArray argsToArray(&aggregator);

    Tuple tpl;
    Object obj1;
    Object obj2;
    Object obj3;
    tpl.push(&obj1);
    tpl.push(&obj2);
    tpl.push(&obj3);

    Boolean isSpread(true);
    argsToArray.addObject(&tpl, &isSpread);

    const std::size_t zero = 0u;
    const std::size_t one = 1u;
    const std::size_t two = 2u;

    EXPECT_EQ(*(aggregator.length()), 3.0);
    EXPECT_TRUE(aggregator[zero]->equals(&obj1)->unboxed());
    EXPECT_TRUE(aggregator[one]->equals(&obj2)->unboxed());
    EXPECT_TRUE(aggregator[two]->equals(&obj3)->unboxed());
}

TEST(ArgsToArrayFixture, MultidimensionalArray)
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