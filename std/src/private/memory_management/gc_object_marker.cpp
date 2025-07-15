#include "std/private/memory_management/gc_object_marker.h"

#include "std/private/algorithms.h"
#include "std/private/logger.h"

#include "std/timer_object.h"

template <typename Element, typename Condition>
void markStorage(AsyncObjectStorage<Element>& storage,
                 const Condition& isReady,
                 UniqueConstObjects& marked,
                 UniqueConstObjects& visited)
{
    for (auto it = storage.begin(); it != storage.end();)
    {
        auto& object = it->second.get();
        if (isReady(object))
        {
            it = storage.erase(it);
            continue;
        }

        utils::visit(&object, visited, [&marked](const Object* obj) { marked.insert(obj); });
        ++it;
    }
}

GCObjectMarker::GCObjectMarker(const Roots& roots, TimerStorage& timers)
    : _roots(roots)
    , _timers(timers)
{
}

GCObjectMarker::~GCObjectMarker() = default;

void GCObjectMarker::mark()
{
    UniqueConstObjects visited;

    const auto isTimerReady = [](const TimerObject& t) { return !t.active(); };
    markStorage(_timers, isTimerReady, _marked, visited);

    for (Object** r : _roots)
    {
        if (r && *r)
        {
            LOG_ADDRESS("Marking root: ", r);
            const Object* rootVal = *r;
            utils::visit(rootVal, visited, [this](const Object* obj) { _marked.insert(obj); });
        }
    }
}

const UniqueConstObjects& GCObjectMarker::getMarked() const
{
    return _marked;
}

bool GCObjectMarker::isMarked(const Object* obj) const
{
    return _marked.count(obj) > 0;
}

void GCObjectMarker::unmark()
{
    _marked.clear();
}