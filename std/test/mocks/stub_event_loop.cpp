#include "stub_event_loop.h"

namespace test
{
StubEventLoop::StubEventLoop()
    : _thread{&StubEventLoop::threadFunc, this}
{
}

StubEventLoop::~StubEventLoop()
{
    stopLoop();
}

int StubEventLoop::run()
{
    _running = true;
    _condVar.notify_one();
    return 0;
}

void StubEventLoop::stop()
{
    stopLoop();
}

bool StubEventLoop::isRunning() const
{
    return _running;
}

void StubEventLoop::enqueue(Callback&& callable)
{
    {
        std::lock_guard<std::mutex> guard(_mutex);
        _writeBuffer.emplace_back(std::move(callable));
    }
    _condVar.notify_one();
}

void StubEventLoop::processEvents()
{
}

void StubEventLoop::startLoop()
{
    enqueue([this] { _running = true; });
}

void StubEventLoop::stopLoop()
{
    enqueue([this] { _running = false; });
    _thread.join();
}

void StubEventLoop::threadFunc() noexcept
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

} // namespace test