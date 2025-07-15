#pragma once

#include "std/private/memory_management/gc_types.h"
#include "std/private/memory_management/igc_validator.h"

#include <functional>

class GCValidator : public IGCValidator
{
public:
    GCValidator(const UniqueObjects& heap, const Roots& roots, const UniqueConstObjects& marked);

    ~GCValidator();

    void validate() const override;

    void onObjectAboutToDelete(void* ptr) const override;

private:
    void checkRoots(const std::function<void(const Object*)>& checker) const;

private:
    const UniqueObjects& _heap;
    const Roots& _roots;
    const UniqueConstObjects& _marked;
};