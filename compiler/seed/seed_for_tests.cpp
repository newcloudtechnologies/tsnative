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