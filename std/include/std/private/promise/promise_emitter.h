#pragma once

#include "std/private/emitter.h"
#include "std/private/events.h"

template <typename T>
using PromiseEmitter = EmitterBase<T, ReadyEvent>;
