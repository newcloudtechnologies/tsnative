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

#include "std/ievent_loop.h"
#include "std/private/emitter.h"

#include <condition_variable>
#include <functional>
#include <future>
#include <thread>
#include <vector>

namespace test
{

class StubEventLoop : public IEventLoop
{
public:
    StubEventLoop();

    StubEventLoop(const StubEventLoop&) = delete;
    StubEventLoop(StubEventLoop&&) noexcept = delete;

    ~StubEventLoop() override;

    StubEventLoop& operator=(const StubEventLoop&) = delete;
    StubEventLoop& operator=(StubEventLoop&&) noexcept = delete;

    int run() override;
    void stop() override;

    bool isRunning() const override;

    void enqueue(Callback&& callable) override;

    void processEvents() override;

private:
    void startLoop();

    void stopLoop();

    void threadFunc() noexcept;

private:
    std::vector<Callback> _writeBuffer;
    std::mutex _mutex;
    std::condition_variable _condVar;
    std::atomic_bool _running{false};
    std::thread _thread;
};

} // namespace test