/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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

#include "std/private/uv_loop_adapter.h"
#include "std/private/uv_timer_adapter.h"

using namespace std::chrono_literals;

TEST(UVTimer, CheckCreateTimer)
{
    UVLoopAdapter loop{};

    UVTimerAdapter timer_1{loop, 1};
    UVTimerAdapter timer_2{loop, 2};

    ASSERT_TRUE(static_cast<bool>(&timer_1));
    ASSERT_TRUE(static_cast<bool>(&timer_2));
    ASSERT_FALSE(timer_1.active());
    ASSERT_FALSE(timer_2.active());
    ASSERT_NE(timer_1.getTimerID(), timer_2.getTimerID());
}

TEST(UVTimer, CheckStartSetTimeout)
{
    UVLoopAdapter loop{};
    UVTimerAdapter timer{loop, 1};
    bool flag = false;
    timer.setTimeout(0s,
                     [&, this]
                     {
                         flag = true;
                         loop.stop();
                     });
    EXPECT_TRUE(timer.active());
    EXPECT_EQ(timer.getRepeat(), 0ms);
    EXPECT_TRUE(loop.hasEventHandlers());
    loop.run();
    EXPECT_TRUE(flag);
}

TEST(UVTimer, CheckNestedTimeout)
{
    UVLoopAdapter loop{};
    UVTimerAdapter timer_1{loop, 1};
    UVTimerAdapter timer_2{loop, 2};
    bool val = false;
    timer_1.setTimeout(0s,
                       [&val, &loop, &timer_2]
                       {
                           timer_2.setTimeout(0s,
                                              [&val, &loop]
                                              {
                                                  val = true;
                                                  loop.stop();
                                              });
                       });
    loop.run();
    EXPECT_TRUE(val);
}

TEST(UVTimer, CheckTimeoutArgs)
{
    UVLoopAdapter loop{};
    UVTimerAdapter timer{loop, 1};
    int expected_a = 1, expected_b = 2, expected_sum_a_b = 0;
    auto f = [&](int a, int b)
    {
        EXPECT_EQ(a, expected_a);
        EXPECT_EQ(b, expected_b);
        expected_sum_a_b = a + b;
    };
    timer.setTimeout(0s,
                     [&loop, f = std::move(f)]
                     {
                         f(1, 2);
                         loop.stop();
                     });
    loop.run();
    EXPECT_EQ(expected_sum_a_b, 3);
}

TEST(UVTimer, CheckStopTimeout)
{
    UVLoopAdapter loop{};
    UVTimerAdapter timer{loop, 1};

    loop.enqueue(
        [&loop, &timer]
        {
            timer.setTimeout(0s, [&loop] { EXPECT_TRUE(false); });
            timer.stop();
            loop.enqueue([&loop] { loop.stop(); });
        });
    loop.run();
}

TEST(UVTimer, CheckStopTimeoutIfCallDestructor)
{
    UVLoopAdapter uvLoop{};
    {
        UVTimerAdapter timer{uvLoop, 1};
        timer.setTimeout(100s, [] { ASSERT_TRUE(false); });
    }
    uvLoop.processEvents();
}

TEST(UVTimer, CheckSetIntervalStopping)
{
    UVLoopAdapter loop{};
    UVTimerAdapter timer{loop, 1};

    int count{0};

    timer.setInterval(1ms,
                      [&]
                      {
                          ASSERT_TRUE(timer.active());
                          if (count == 10)
                          {
                              timer.stop();
                              loop.stop();
                              return;
                          }
                          ++count;
                      });
    EXPECT_EQ(timer.getRepeat(), 1ms);
    loop.run();
    EXPECT_EQ(10, count);
    ASSERT_FALSE(timer.active());
}