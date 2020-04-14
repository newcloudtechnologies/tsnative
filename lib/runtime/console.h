#pragma once

namespace console
{

template <typename T>
void log(T value);

}

#define DECLARE_PRINT_FN(TYPE, FN) \
    template<> void console::log(TYPE instance) { \
        FN(instance); \
    }
