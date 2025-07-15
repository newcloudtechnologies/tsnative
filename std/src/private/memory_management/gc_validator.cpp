#include "std/private/memory_management/gc_validator.h"
#include "std/private/memory_management/default_gc.h"

#include "std/private/logger.h"

#include "std/private/algorithms.h"

namespace
{
constexpr auto validationStr = "========== Validation =========";
}

GCValidator::GCValidator(const UniqueObjects& heap, const Roots& roots, const UniqueConstObjects& marked)
    : _heap(heap)
    , _roots(roots)
    , _marked(marked)
{
    LOG_INFO("Creating GCValidator");
}

GCValidator::~GCValidator()
{
    LOG_INFO("Deleting GCValidator");
}

void GCValidator::checkRoots(const std::function<void(const Object*)>& checker) const
{
    std::unordered_set<const Object*> visited;

    for (const auto* r : _roots)
    {
        if (!r || !*r)
        {
            LOG_GC(validationStr);
            LOG_GC_ADDRESS("Found invalid root ", r);
            throw std::runtime_error("Invalid root");
        }

        const auto* rootVal = *r;

        utils::visit(rootVal, visited, checker);
    }
}

void GCValidator::onObjectAboutToDelete(void* ptr) const
{
    auto obj = Object::asObjectPtr(ptr);
    bool gcManaged = _heap.count(obj) > 0;
    if (!gcManaged)
    {
        LOG_GC(validationStr);
        LOG_GC_ADDRESS("Deleting object not in the heap ", ptr);
        throw std::runtime_error("Deleting object not in the heap");
    }

    checkRoots(
        [obj](const Object* el)
        {
            if (obj == el)
            {
                LOG_GC(validationStr);
                LOG_GC_ADDRESS("Deleting object while it is in roots graph ", obj);
                throw std::runtime_error("Deleting object not in the heap");
            }
        });
}

void GCValidator::validate() const
{
    const auto checkMarked = [this](const Object* obj)
    {
        if (_marked.count(obj) > 0 && obj->getChildObjects().size() > 0)
        {
            LOG_GC(validationStr);
            LOG_GC_ADDRESS("Found marked object with children in the graph after sweep ", &obj);
            throw std::runtime_error("Found marked object after sweep");
        }
    };

    checkRoots([checkMarked](const Object* obj) { checkMarked(obj); });
}