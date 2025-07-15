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