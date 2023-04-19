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

#include "std/make_closure_from_lambda.h"
#include "std/private/memory_management/gc_object_marker.h"
#include "std/private/uv_loop_adapter.h"

#include <memory>
#include <vector>

namespace
{

class MarkingTestFixture : public test::GlobalTestAllocatorFixture
{
public:
    enum class ExecutorCall
    {
        Resolve,
        Reject
    };

public:
    test::Closure* makeClosureExecutor(test::Number* value, ExecutorCall executorCall) const
    {
        return makeClosure<test::Closure>(
            [value, executorCall = std::move(executorCall)](TSClosure** resolve, TSClosure** reject)
            {
                executorCall == ExecutorCall::Resolve ? (*resolve)->setEnvironmentElement(value, 0)
                                                      : (*reject)->setEnvironmentElement(value, 0);

                return test::Undefined::instance();
            });
    }
};

TEST_F(MarkingTestFixture, empty)
{
    Roots roots;
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);
    marker.mark();

    EXPECT_TRUE(marker.getMarked().empty());
    auto o = new test::Object();
    EXPECT_FALSE(marker.isMarked(o));
}

TEST_F(MarkingTestFixture, object)
{
    auto o = new test::Object();
    o->set("child", new test::Object());

    Roots roots{reinterpret_cast<Object**>(&o)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_TRUE(marker.getMarked().empty());

    marker.mark();

    EXPECT_EQ(marker.getMarked().size(), 3); // object + prop key + prop value

    marker.unmark();

    EXPECT_EQ(marker.getMarked().size(), 0);
}

TEST_F(MarkingTestFixture, boolean)
{
    auto boolean = new test::Boolean(true);

    Roots roots{reinterpret_cast<Object**>(&boolean)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());

    marker.mark();

    EXPECT_EQ(marker.getMarked().size(), 1);
}

TEST_F(MarkingTestFixture, string)
{
    auto string = new test::String("Abacaba");

    Roots roots{reinterpret_cast<Object**>(&string)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());

    marker.mark();

    EXPECT_EQ(marker.getMarked().size(), 1);
}

TEST_F(MarkingTestFixture, number)
{
    auto number = new test::Number(10);

    Roots roots{reinterpret_cast<Object**>(&number)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());

    marker.mark();

    EXPECT_EQ(marker.getMarked().size(), 1);
}

TEST_F(MarkingTestFixture, date)
{
    auto date = new test::Date();

    Roots roots{reinterpret_cast<Object**>(&date)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());

    marker.mark();

    EXPECT_EQ(marker.getMarked().size(), 1);
}

TEST_F(MarkingTestFixture, union)
{
    auto child = new test::Object();
    auto u = new test::Union(child);

    Roots roots{reinterpret_cast<Object**>(&u)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());

    marker.mark();

    EXPECT_EQ(marker.getMarked().size(), 2);
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

    void*** env = (void***)malloc(2 * sizeof(void**));
    env[0] = o1Star;
    env[1] = o2Star;

    auto* numArgs = new test::Number(0.f);   // should be marked
    auto* envLength = new test::Number(2.f); // should be marked
    ::Number optionals(0.f);                 // should NOT be marked

    void* closureBodyVoidStar = (void*)(&closureBody);
    auto closure = new test::Closure(closureBodyVoidStar, env, envLength, numArgs, &optionals);

    Roots roots{reinterpret_cast<Object**>(&closure)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(5u, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(), 3); // closure + two objects
}

TEST_F(MarkingTestFixture, lazy_closure)
{
    void*** env = (void***)malloc(2 * sizeof(void**));

    auto* lazyClosure = new test::LazyClosure(env);

    Roots roots{reinterpret_cast<Object**>(&lazyClosure)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(), 1);
}

TEST_F(MarkingTestFixture, array)
{
    auto arr = new test::Array<Object*>();
    arr->push(new test::Object());
    arr->push(new test::Object());

    Roots roots{reinterpret_cast<Object**>(&arr)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(3u, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(), 3);
}

TEST_F(MarkingTestFixture, tuple)
{
    auto tuple = new test::Tuple();
    tuple->push(new test::Object());
    tuple->push(new test::Object());
    tuple->push(new test::Object());

    Roots roots{reinterpret_cast<Object**>(&tuple)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(4u, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(), 4);
}

TEST_F(MarkingTestFixture, set)
{
    auto set = new test::Set<Object*>();
    set->add(new test::Object());

    Roots roots{reinterpret_cast<Object**>(&set)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(), 2);
}

TEST_F(MarkingTestFixture, map)
{
    auto map = new test::Map<Object*, Object*>();
    auto key = new test::Object();
    auto value = new test::Object();

    map->set(key, value);

    Roots roots{reinterpret_cast<Object**>(&map)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(3u, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(), 3);
}

TEST_F(MarkingTestFixture, timer)
{
    UVLoopAdapter uvLoopAdapter{};
    auto* closure = makeClosure<test::Closure>([] { return nullptr; });
    const auto id = 1;
    auto* timer = new test::Timer{uvLoopAdapter, closure, id};

    using namespace std::chrono_literals;
    timer->setTimeout(500ms);

    Roots roots;
    TimerStorage timers;
    timers.emplace(id, *timer);
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(2u, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(), 2); // timer, closure
}

TEST_F(MarkingTestFixture, promiseConstructor)
{
    auto* executor = makeClosureExecutor(new test::Number{23.f}, ExecutorCall::Resolve);
    auto* promise = new test::Promise(executor);

    Roots roots{reinterpret_cast<Object**>(&promise)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(3u, allObjects.size());

    marker.mark();

    EXPECT_THAT(marker.getMarked().size(),
                6); // promise, closure + 1 env element, resolove promise and undef in args
}

TEST_F(MarkingTestFixture, promiseCallbackThen)
{
    auto* executor = makeClosureExecutor(new test::Number{23.f}, ExecutorCall::Resolve);
    auto* startPromise = new test::Promise(executor);
    auto* resolve = new test::Union{};
    auto* reject = new test::Union{};
    auto* endPromise = startPromise->then(resolve, reject);

    Roots roots{reinterpret_cast<Object**>(&endPromise)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(5u, allObjects.size());

    marker.mark();

    EXPECT_THAT(
        marker.getMarked().size(),
        9); // promise, closure + 2 enviroment el. , resolove promise and undef in args, two unions, another promise
}

TEST_F(MarkingTestFixture, promiseCallbackCatch)
{
    auto* executor = makeClosureExecutor(new test::Number{23.f}, ExecutorCall::Reject);
    auto* startPromise = new test::Promise(executor);
    auto* reject = new test::Union{};
    auto* endPromise = startPromise->catchException(reject);

    Roots roots{reinterpret_cast<Object**>(&endPromise)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(4u, allObjects.size());

    marker.mark();

    EXPECT_THAT(
        marker.getMarked().size(),
        9); // promise, closure + 2 enviroment el., resolove promise and undef in args, two unions, another promise
}

TEST_F(MarkingTestFixture, promiseCallbackFinally)
{
    auto* executor = makeClosureExecutor(new test::Number{23.f}, ExecutorCall::Resolve);
    auto* startPromise = new test::Promise(executor);
    auto* finally = new test::Union{};
    auto* endPromise = startPromise->finally(finally);

    Roots roots{reinterpret_cast<Object**>(&endPromise)};
    TimerStorage timers;
    GCObjectMarker marker(roots, timers);

    const auto& allObjects = getActualAllocatedObjects();

    EXPECT_EQ(4u, allObjects.size());

    marker.mark();

    EXPECT_THAT(
        marker.getMarked().size(),
        8); // promise, closure + 2 enviroment el., resolove promise and undef in ars, one union, another promise
}
} // anonymous namespace
