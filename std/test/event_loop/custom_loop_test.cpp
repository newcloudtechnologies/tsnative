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

#include "events.h"
#include "std/private/emitter.h"
#include "std/private/ievent_loop.h"
#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include <condition_variable>
#include <functional>
#include <future>
#include <thread>
#include <vector>

class CustomEventLoop : public IEventLoop
{
public:
    CustomEventLoop()
        : _thread{&CustomEventLoop::threadFunc, this}
    {
    }
    CustomEventLoop(const CustomEventLoop&) = delete;
    CustomEventLoop(CustomEventLoop&&) noexcept = delete;

    ~CustomEventLoop() override
    {
        stopLoop();
    }

    CustomEventLoop& operator=(const CustomEventLoop&) = delete;
    CustomEventLoop& operator=(CustomEventLoop&&) noexcept = delete;

    int run(bool lock = true) override
    {
        _running = true;
        _condVar.notify_one();
        return 0;
    }

    void stop() override
    {
        stopLoop();
    }

    bool isRunning() const override
    {
        return _running;
    }

    void enqueue(Callback&& callable) override
    {
        {
            std::lock_guard<std::mutex> guard(_mutex);
            _writeBuffer.emplace_back(std::move(callable));
        }
        _condVar.notify_one();
    }

    void processEvents() override
    {
    }

private:
    void startLoop()
    {
        enqueue([this] { _running = true; });
    }

    void stopLoop()
    {
        enqueue([this] { _running = false; });
        _thread.join();
    }

    void threadFunc() noexcept
    {
        std::vector<Callback> read_buffer;

        while (_running)
        {
            {
                std::unique_lock<std::mutex> lock(_mutex);
                _condVar.wait(lock, [this] { return !_writeBuffer.empty(); });
                std::swap(read_buffer, _writeBuffer);
            }

            for (Callback& func : read_buffer)
            {
                func();
            }
            read_buffer.clear();
        }
    }

private:
    std::vector<Callback> _writeBuffer;
    std::mutex _mutex;
    std::condition_variable _condVar;
    std::atomic_bool _running{false};
    std::thread _thread;
};

using namespace std::chrono_literals;

TEST(CustomLoop, InitLoop)
{
    CustomEventLoop loop;

    ASSERT_FALSE(loop.isRunning());
    loop.run();
    ASSERT_TRUE(loop.isRunning());
}

TEST(CustomLoop, CheckEmitEventForLoop)
{
    CustomEventLoop loop;
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