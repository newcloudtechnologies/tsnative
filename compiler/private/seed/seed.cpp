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

int main(int argc, char* argv[])
{
    int result = Runtime::init(argc, argv);
    if (result != 0)
    {
        return result;
    }

    result = __ts_main();

    return result;
}