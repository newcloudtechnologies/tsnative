#pragma once

#include <cstddef>

using ScopeHandle = std::size_t;

struct CallStackFrame final
{
    ScopeHandle scopeHandle = 0;
};