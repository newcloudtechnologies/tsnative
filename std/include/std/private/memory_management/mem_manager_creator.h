/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <memory>

#include "std/private/memory_management/async_object_storage.h"

class MemoryManager;
class IEventLoop;

std::unique_ptr<MemoryManager> createMemoryManager(TimerStorage& storage, IEventLoop* loop);