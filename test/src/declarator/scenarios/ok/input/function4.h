#pragma once

#include <TS.h>
#include <std/tsnumber.h>

template <typename T>
void max(T* k, T* m, T* n);

template <typename T>
TS_EXPORT T* ret();

template <typename T>
TS_EXPORT void max(T* m, T* n);

template <typename T>
TS_EXPORT void min(T* m, T* n);
