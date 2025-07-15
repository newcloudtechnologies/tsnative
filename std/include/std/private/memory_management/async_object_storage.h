#pragma once

#include <cstddef>
#include <unordered_map>

#include "std/id_generator.h"
#include "std/timer_object.h"

template <typename Element>
using AsyncObjectStorage = std::unordered_map<ID, Element>;

using TimerStorage = AsyncObjectStorage<std::reference_wrapper<TimerObject>>;