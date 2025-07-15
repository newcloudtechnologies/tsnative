#pragma once

#include <memory>

#include "std/private/memory_management/async_object_storage.h"

class MemoryManager;
class IEventLoop;

std::unique_ptr<MemoryManager> createMemoryManager(TimerStorage& storage, IEventLoop* loop);