#include "std/iterable.h"
#include "std/tsarray.h"
#include "std/tsmap.h"
#include "std/tsset.h"
#include "std/tsstring.h"

template class Array<String*>;
template class IteratorResult<String*>;

template class Array<void*>;
template class Map<void*, void*>;
template class Set<void*>;
template class IteratorResult<void*>;
