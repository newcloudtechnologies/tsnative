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

#pragma once

#include <cstddef>
#include <unordered_map>

#include "std/id_generator.h"
#include "std/timer_object.h"
#include "std/tspromise.h"

template <typename Element>
using AsyncObjectStorage = std::unordered_map<ID, Element>;

using TimerStorage = AsyncObjectStorage<std::reference_wrapper<TimerObject>>;
using PromiseStorage = AsyncObjectStorage<std::reference_wrapper<Promise>>;