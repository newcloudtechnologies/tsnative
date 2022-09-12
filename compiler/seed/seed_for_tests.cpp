#include "std/event_loop.h"
#include "std/runtime.h"
#include "std/tsnumber.h"
#include "tsmain.h"

int main(int argc, char* argv[])
{
    int result = Runtime::init(argc, argv);
    if (result != 0)
    {
        return result;
    }
    result = __ts_main();
    if (result != 0)
    {
        return result;
    }
#ifdef TS_RUN_EVENT_LOOP
    EventLoop* loop = Runtime::getLoop();
    loop->enqueue([loop] { loop->stop(); });
    result = loop->run()->unboxed();
#endif

    return result;
}