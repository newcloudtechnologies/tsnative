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

#include "std/private/memory_management/igc_validator.h"

#include <functional>
#include <unordered_set>

class GCValidator : public IGCValidator
{
public:
    using Heap = std::unordered_set<Object*>;
    using Roots = std::unordered_set<Object**>;

    GCValidator(const Heap& heap, const Roots& roots);

    ~GCValidator();

    void validate() const override;

    void onObjectAboutToDelete(void* ptr) const override;

private:
    void checkRoots(const std::function<void(const Object&)>& checker) const;

private:
    const Heap& _heap;
    const Roots& _roots;
};