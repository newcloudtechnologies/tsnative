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

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../infrastructure/global_test_allocator_fixture.h"
#include "../infrastructure/object_wrappers.h"

#include "std/private/make_closure_from_lambda.h"
#include "std/private/uv_loop_adapter.h"

#include <memory>
#include <vector>

namespace
{

MATCHER_P(IsMarked, state, "")
{
    return arg->isMarked() == state;
}

class MarkingTestFixture : public test::GlobalTestAllocatorFixture
{
public:
    test::Closure* makeClosureExecutor() const
    {
        return makeClosure<test::Closure>(
            [](TSClosure** resolve)
            {
                (*resolve)->setEnvironmentElement(new test::Number{23.f}, 0);
                return test::Undefined::instance();
            });
    }
};

TEST_F(MarkingTestFixture, object)
{
    auto o = new test::Object();
    o->set("child", new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    o->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, boolean)
{
    auto boolean = new test::Boolean(true);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    boolean->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, string)
{
    auto string = new test::String("Abacaba");

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    string->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, number)
{
    auto number = new test::Number(10);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    number->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, date)
{
    auto date = new test::Date();

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    date->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, union)
{
    auto child = new test::Object();
    auto u = new test::Union(child);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    u->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

void closureBody(){};

TEST_F(MarkingTestFixture, closure)
{
    auto* o1 = new test::Object(); // should be marked
    auto* o2 = new test::Object(); // should be marked

    auto** o1Star = (void**)malloc(sizeof(void*));
    auto** o2Star = (void**)malloc(sizeof(void*));
    *o1Star = (void*)o1;
    *o2Star = (void*)o2;

    LOG_ADDRESS("o1Star ", o1Star);
    LOG_ADDRESS("o2Star ", o2Star);

    void*** env = (void***)malloc(2 * sizeof(void**));
    env[0] = o1Star;
    env[1] = o2Star;

    auto* numArgs = new test::Number(0.f);   // should be marked
    auto* envLength = new test::Number(2.f); // should be marked
    ::Number optionals(0.f);                 // should NOT be marked

    void* closureBodyVoidStar = (void*)(&closureBody);
    auto closure = new test::Closure(closureBodyVoidStar, env, envLength, numArgs, &optionals);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(5u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    closure->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, lazy_closure)
{
    void*** env = (void***)malloc(2 * sizeof(void**));

    auto* lazyClosure = new test::LazyClosure(env);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    lazyClosure->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, array)
{
    auto arr = new test::Array<Object*>();
    arr->push(new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    arr->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, tuple)
{
    auto tuple = new test::Tuple();
    tuple->push(new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    tuple->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, set)
{
    auto set = new test::Set<Object*>();
    set->add(new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    set->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, map)
{
    auto map = new test::Map<Object*, Object*>();
    auto key = new test::Object();
    auto value = new test::Object();

    map->set(key, value);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(3u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    map->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, timer)
{
    UVLoopAdapter uvLoopAdapter{};
    auto* closure = makeClosure<test::Closure>([] { return nullptr; });
    auto* timer = new test::Timer{uvLoopAdapter, closure, 1};

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    timer->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, promiseConstructor)
{
    auto* executor = makeClosureExecutor();
    auto* promise = new test::Promise(executor);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(3u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    promise->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, promiseCallbackThen)
{
    auto* executor = makeClosureExecutor();
    auto* startPromise = new test::Promise(executor);
    auto* resolve = new test::Union{};
    auto* reject = new test::Union{};
    auto* endPromise = startPromise->then(resolve, reject);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(5u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    startPromise->mark();
    endPromise->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, promiseCallbackCatch)
{
    auto* executor = makeClosureExecutor();
    auto* startPromise = new test::Promise(executor);
    auto* reject = new test::Union{};
    auto* endPromise = startPromise->catchException(reject);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(4u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    startPromise->mark();
    endPromise->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, promiseCallbackFinally)
{
    auto* executor = makeClosureExecutor();
    auto* startPromise = new test::Promise(executor);
    auto* finally = new test::Union{};
    auto* endPromise = startPromise->finally(finally);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(4u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    startPromise->mark();
    endPromise->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}
} // anonymous namespace