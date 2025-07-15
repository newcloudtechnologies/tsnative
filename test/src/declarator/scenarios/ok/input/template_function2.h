#pragma once

#include <TS.h>

namespace console IS_TS_MODULE
{

template <typename T>
TS_EXPORT TS_SIGNATURE("function log(): void") void log(T* t);

} // namespace IS_TS_MODULE

template <typename T>
void console::log(T* t)
{
}
