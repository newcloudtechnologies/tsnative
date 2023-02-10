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

#include "../mocks/stub_event_loop.h"
#include "events.h"

#include <gtest/gtest.h>

namespace
{
using namespace std::chrono_literals;

TEST(CustomLoop, InitLoop)
{
    test::StubEventLoop loop;

    ASSERT_FALSE(loop.isRunning());
    loop.run();
    ASSERT_TRUE(loop.isRunning());
}

TEST(CustomLoop, CheckEmitEventForLoop)
{
    test::StubEventLoop loop;
    loop.run();

    int mouse_event_x = 3;
    int mouse_event_y = 4;

    MouseEvent mouse_event{mouse_event_x, mouse_event_y};

    MockEmitter emitter{};

    ASSERT_FALSE(emitter.has<MouseEvent>());

    emitter.on<MouseEvent>(
        [&loop, &emitter, mouse_event_x, mouse_event_y](const auto& event, auto& sender)
        {
            loop.enqueue(
                [&sender, &emitter, mouse_event_x, mouse_event_y, event]
                {
                    ASSERT_TRUE(&sender == &emitter);
                    ASSERT_TRUE(event.x == mouse_event_x);
                    ASSERT_TRUE(event.y == mouse_event_y);
                });
        });

    emitter.on<ErrorEvent>([](auto&&...) { FAIL(); });

    ASSERT_TRUE(emitter.has<MouseEvent>());

    ASSERT_TRUE(emitter.has<ErrorEvent>());

    emitter.emit(mouse_event);

    emitter.reset<ErrorEvent>();
    emitter.emit(ErrorEvent{});

    emitter.reset();

    ASSERT_FALSE(emitter.has<MouseEvent>());
    ASSERT_FALSE(emitter.has<ErrorEvent>());
}
} // namespace