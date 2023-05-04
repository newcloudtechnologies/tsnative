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

#include "std/id_generator.h"
#include "std/make_closure_from_lambda.h"
#include "std/private/uv_loop_adapter.h"
#include "std/private/uv_timer_adapter.h"
#include "std/tsclosure.h"

using namespace std::chrono_literals;

class UVTimerTestFixture : public test::GlobalTestAllocatorFixture
{
public:
    void SetUp() override
    {
        TestAllocator::Callbacks allocatorCallbacks;
        allocatorCallbacks.onAllocated = [this](void* o)
        {
            auto* obj = static_cast<test::Object*>(o);
            _allocated.push_back(obj);
        };
        _allocator = std::make_unique<TestAllocator>(std::move(allocatorCallbacks));
    }

    void TearDown() override
    {
        _allocator = nullptr;

        for (auto* o : _allocated)
        {
            delete o;
        }
        _allocated.clear();
    }

    template <typename Func>
    test::Closure* createClosure(Func&& func)
    {
        return makeClosure<test::Closure>(std::forward<Func>(func));
    }

    UVLoopAdapter& getLoop()
    {
        return _loop;
    }

    test::Timer* createTimer(test::Closure* closure, ID timerID)
    {
        return new test::Timer(getLoop(), closure, timerID);
    }

private:
    std::vector<test::Object*> _allocated{};
    UVLoopAdapter _loop{};
};

TEST_F(UVTimerTestFixture, checkCreateTimer)
{
    auto closure = createClosure([]() { return nullptr; });

    auto* timer_1 = createTimer(closure, 1);
    auto* timer_2 = createTimer(closure, 2);

    ASSERT_TRUE(static_cast<bool>(&timer_1));
    ASSERT_TRUE(static_cast<bool>(&timer_2));
    ASSERT_FALSE(timer_1->active());
    ASSERT_FALSE(timer_2->active());
    ASSERT_NE(timer_1->getID(), timer_2->getID());
}

TEST_F(UVTimerTestFixture, checkStartSetTimeout)
{
    bool flag = false;
    auto* closure = createClosure(
        [&flag, this]()
        {
            flag = true;
            return nullptr;
        });

    auto* timer = createTimer(closure, 1);

    timer->setTimeout(0s);

    EXPECT_TRUE(timer->active());
    EXPECT_EQ(timer->getRepeat(), 0ms);
    EXPECT_TRUE(getLoop().hasEventHandlers());
    getLoop().run();

    EXPECT_TRUE(flag);
}

TEST_F(UVTimerTestFixture, checkNestedTimeout)
{
    bool val = false;

    auto f2 = [&val, this]
    {
        val = true;
        return nullptr;
    };
    auto* closure2 = createClosure(std::move(f2));
    auto* timer_2 = createTimer(closure2, 2);

    auto f1 = [timer_2]()
    {
        timer_2->setTimeout(0ms);
        return nullptr;
    };
    auto* closure1 = createClosure(std::move(f1));
    auto* timer_1 = createTimer(closure1, 1);

    timer_1->setTimeout(0s);
    getLoop().run();

    EXPECT_TRUE(val);
}

TEST_F(UVTimerTestFixture, checkTimeoutArgs)
{
    int expected_a = 1, expected_b = 2, expected_sum_a_b = 0;
    auto f = [&](int a, int b)
    {
        EXPECT_EQ(a, expected_a);
        EXPECT_EQ(b, expected_b);
        expected_sum_a_b = a + b;
    };

    auto* closure = createClosure(
        [this, f = std::move(f)]()
        {
            f(1, 2);
            return nullptr;
        });

    auto* timer = createTimer(closure, 1);

    timer->setTimeout(0s);
    getLoop().run();

    EXPECT_EQ(expected_sum_a_b, 3);
}

TEST_F(UVTimerTestFixture, checkStopTimeout)
{
    auto* closure = createClosure(
        []()
        {
            EXPECT_TRUE(false);
            return nullptr;
        });

    auto* timer = createTimer(closure, 1);

    getLoop().enqueue(
        [this, timer]
        {
            timer->setTimeout(0s);
            timer->stop();
        });
    getLoop().run();
}

TEST_F(UVTimerTestFixture, checkStopTimeoutIfCallDestructor)
{
    {
        auto* closure = createClosure(
            []()
            {
                EXPECT_TRUE(false);
                return nullptr;
            });

        auto* timer = createTimer(closure, 1);
        timer->setTimeout(100s);
    }
    getLoop().processEvents();
}

TEST_F(UVTimerTestFixture, checkSetIntervalStopping)
{
    int count{0};

    test::Timer* timer{nullptr};

    auto* closure = createClosure(
        [this, &timer, &count]()
        {
            if (count == 10)
            {
                timer->stop();
                return nullptr;
            }
            ++count;
            return nullptr;
        });

    timer = createTimer(closure, 1);

    timer->setInterval(1ms);

    EXPECT_EQ(timer->getRepeat(), 1ms);

    getLoop().run();

    EXPECT_EQ(10, count);
    ASSERT_FALSE(timer->active());
}

TEST_F(UVTimerTestFixture, checkSetTimeoutNotZero)
{
    bool flag = false;
    auto* closure = createClosure(
        [&flag, this]()
        {
            flag = true;
            return nullptr;
        });

    auto* timer = createTimer(closure, 1);
    timer->setTimeout(50ms);

    getLoop().run();

    EXPECT_TRUE(flag);
}