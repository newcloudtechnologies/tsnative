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

#include "../infrastructure/dequeue_backend_fixtures.h"
#include "std/private/tsarray_std_p.h"

TEST_F(DequeueBackendFixture, EmptyArray)
{
    DequeueBackend<Object*> arrayImpl;
    EXPECT_EQ(arrayImpl.join("~~~~~"), "");
}

TEST_F(DequeueBackendFixture, SimpleJoin)
{
    DequeueBackend<Object*> arrayImpl;
    arrayImpl.push(new test::Boolean(true));

    EXPECT_EQ(arrayImpl.join(), "true");

    arrayImpl.push(new test::Boolean(false));
    arrayImpl.push(new test::Boolean(true));

    EXPECT_EQ(arrayImpl.join(), "true,false,true");
}

TEST_F(DequeueBackendFixture, ObjectsJoin)
{
    DequeueBackend<Object*> arrayImpl;
    arrayImpl.push(new test::Object());
    arrayImpl.push(new test::Object());
    arrayImpl.push(new test::Object());

    EXPECT_EQ(arrayImpl.join(), "[object Object],[object Object],[object Object]");
}

TEST_F(DequeueBackendFixture, CustomSeparatorJoin)
{
    DequeueBackend<Object*> arrayImpl;
    arrayImpl.push(new test::Boolean(true));
    arrayImpl.push(new test::Boolean(true));
    arrayImpl.push(new test::Boolean(true));
    arrayImpl.push(new test::Boolean(false));

    EXPECT_EQ(arrayImpl.join(""), "truetruetruefalse");
    EXPECT_EQ(arrayImpl.join("---"), "true---true---true---false");
}