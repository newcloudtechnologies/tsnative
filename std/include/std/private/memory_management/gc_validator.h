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