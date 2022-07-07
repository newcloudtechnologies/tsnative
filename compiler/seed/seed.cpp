#include "tsmain.h"

#include "std/runtime.h"

int main(int argc, char* argv[])
{
    Runtime::init(argc, argv);
    const auto res = __ts_main();
    Runtime::destroy();

    return res;
}