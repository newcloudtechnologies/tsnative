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