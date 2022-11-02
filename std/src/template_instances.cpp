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

#include "std/iterable.h"
#include "std/tsarray.h"
#include "std/tsmap.h"
#include "std/tsset.h"
#include "std/tsstring.h"

template class Array<String*>;
template class IteratorResult<String*>;

template class Array<Object*>;
template class IteratorResult<Object*>;

template class Array<void*>;
template class Map<void*, void*>;
template class Set<void*>;
template class IteratorResult<void*>;
