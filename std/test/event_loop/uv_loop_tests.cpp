#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "events.h"
#include "std/private/uv_loop_adapter.h"

using namespace std::chrono_literals;

class UVLoopAdapterTest : public ::testing::Test
{
protected:
    void TearDown() override
    {
        loop.stop();
    }

protected:
    UVLoopAdapter loop{};
};

TEST_F(UVLoopAdapterTest, InitLoop)
{
    ASSERT_FALSE(loop.isRunning());
    ASSERT_NO_THROW(loop.stop());
    ASSERT_FALSE(loop.isRunning());

    loop.enqueue(
        [this]
        {
            ASSERT_TRUE(loop.isRunning());
            loop.stop();
        });
    ASSERT_NO_THROW(loop.run());
}

TEST_F(UVLoopAdapterTest, CheckEmitEventForLoop)
{
    int mouse_event_x = 3;
    int mouse_event_y = 4;

    MouseEvent mouse_event{mouse_event_x, mouse_event_y};

    MockEmitter emitter{};

    ASSERT_FALSE(emitter.has<MouseEvent>());

    emitter.on<MouseEvent>(
        [this, &emitter, mouse_event_x, mouse_event_y](const auto& event, auto& sender)
        {
            loop.enqueue(
                [this, &sender, &emitter, mouse_event_x, mouse_event_y, event]
                {
                    ASSERT_TRUE(&sender == &emitter);
                    ASSERT_TRUE(event.x == mouse_event_x);
                    ASSERT_TRUE(event.y == mouse_event_y);
                    loop.stop();
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

    ASSERT_TRUE(loop.hasEventHandlers());

    ASSERT_NO_THROW(loop.run());

    ASSERT_FALSE(loop.hasEventHandlers());

    ASSERT_FALSE(loop.isRunning());
}

struct QuitEvent
{
};

class Emitter : public UVLoopAdapter::EventEmitter<Emitter, int, std::string, QuitEvent>
{
public:
    Emitter(UVLoopAdapter& loop)
        : _loop{loop}
    {
    }

    template <typename Event, typename Func>
    void connect(Func&& f)
    {
        on<Event>([f = std::forward<Func>(f)](Event& e, Emitter& h)
                  { h._loop.enqueue([f = std::move(f), e] { f(e); }); });
    }

    template <typename Event>
    void notify(Event event)
    {
        emit(std::move(event));
    }

    template <typename Event, typename... Events>
    void notify(Event event, Events... events)
    {
        notify(std::move(event));
        notify(events...);
    }

private:
    UVLoopAdapter& _loop;
};

TEST_F(UVLoopAdapterTest, CheckCancelSlots)
{
    Emitter emitter{loop};

    int event{23};

    emitter.connect<QuitEvent>([this](auto) { loop.stop(); });

    emitter.connect<int>([event_val = event](int int_event) { FAIL(); });

    emitter.connect<int>([event_val = event](int int_event) { FAIL(); });

    emitter.connect<std::string>(
        [&emitter](const std::string& s)
        {
            EXPECT_EQ("hello", s);

            emitter.connect<int>(
                [&emitter](int)
                {
                    EXPECT_FALSE(emitter.has<std::string>());
                    emitter.notify(QuitEvent{});
                });
            emitter.reset<std::string>();
            emitter.notify(int{});
        });

    emitter.reset<int>();

    EXPECT_FALSE(emitter.has<int>());
    EXPECT_TRUE(emitter.has<std::string>());

    emitter.notify(event, std::string{"hello"});
    loop.run();
}

TEST_F(UVLoopAdapterTest, CheckOrdering)
{
    int val = 0;
    {
        Emitter emitter{loop};

        emitter.connect<int>([&val](int) { EXPECT_EQ(++val, 1); });

        emitter.connect<int>([&val](int) { EXPECT_EQ(++val, 2); });

        emitter.connect<std::string>(
            [this, &val](std::string)
            {
                EXPECT_EQ(++val, 3);
                loop.stop();
            });

        loop.enqueue([&] { emitter.notify(int{}, std::string{}); });

        EXPECT_EQ(val, 0);
        loop.run();
    }
    EXPECT_EQ(val, 3);
}

TEST_F(UVLoopAdapterTest, CheckPingPong)
{
    Emitter emitter_1{loop};

    Emitter emitter_2{loop};

    emitter_1.connect<std::string>(
        [&, this](std::string msg)
        {
            EXPECT_EQ(msg, "PING");
            emitter_1.reset();
            emitter_1.connect<std::string>(
                [this](std::string msg)
                {
                    EXPECT_EQ(msg, "PONG");
                    loop.stop();
                });
            emitter_2.notify(std::string{"PING"});
        });

    emitter_2.connect<std::string>(
        [this, &emitter_1](std::string msg)
        {
            EXPECT_EQ(msg, "PING");
            emitter_1.notify(std::string{"PONG"});
        });
    emitter_1.notify(std::string{"PING"});
    loop.run();
}

TEST_F(UVLoopAdapterTest, checkWithoutExplicitlyStoping)
{
    int count{0};
    {
        loop.enqueue(
            [this, &count]()
            {
                ++count;
                EXPECT_TRUE(loop.isRunning());
            });
        loop.enqueue(
            [this, &count]()
            {
                ++count;
                EXPECT_TRUE(loop.isRunning());
            });
        loop.run();
    }
    EXPECT_EQ(count, 2);
    EXPECT_FALSE(loop.isRunning());
    EXPECT_FALSE(loop.hasEventHandlers());
}

TEST_F(UVLoopAdapterTest, checkRunRun)
{
    int count{0};

    loop.enqueue([&count] { ++count; });
    loop.enqueue([&count] { ++count; });

    EXPECT_EQ(count, 0);

    loop.run();

    EXPECT_FALSE(loop.isRunning());
    loop.enqueue(
        [this, &count]
        {
            ++count;
            EXPECT_TRUE(loop.isRunning());
        });

    loop.run();

    EXPECT_EQ(count, 3);
    EXPECT_FALSE(loop.isRunning());
}

TEST_F(UVLoopAdapterTest, checkProcessEvents)
{
    int count{0};

    loop.enqueue([&count] { ++count; });
    loop.enqueue([&count] { ++count; });

    loop.processEvents();

    EXPECT_FALSE(loop.isRunning());
    EXPECT_FALSE(loop.hasEventHandlers());

    loop.enqueue([&count] { ++count; });

    EXPECT_EQ(count, 2);

    loop.run();

    EXPECT_EQ(count, 3);
}