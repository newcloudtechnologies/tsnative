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