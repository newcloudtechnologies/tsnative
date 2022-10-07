/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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
