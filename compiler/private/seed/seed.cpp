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

// A customizable seed for running on CI with backjack and stack traces
#include "tsmain.h"

#include "std/runtime.h"

#include <exception>
#include <execinfo.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

// TODO remove me
void handler(int sig)
{
    void* array[10];
    size_t size;

    // get void*'s for all entries on the stack
    size = backtrace(array, 10);

    // print out all the frames to stderr
    fprintf(stderr, "Error: signal %d:\n", sig);
    backtrace_symbols_fd(array, size, STDERR_FILENO);

    std::terminate();
}

int main(int argc, char* argv[])
{
    int result = Runtime::init(argc, argv);
    if (result != 0)
    {
        return result;
    }

    // TODO remove me
    signal(SIGSEGV, handler);

    result = __ts_main();

    return result;
}