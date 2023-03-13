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

#include "std/gc.h"
#include "std/runtime.h"

#include "std/private/logger.h"

#include <memory>

template <typename TObj>
class TSObjectOwner;

template <typename TObj>
TSObjectOwner<TObj> make_object_owner(TObj* t);

template <typename TObj>
class TSObjectOwner
{
    static_assert(std::is_base_of<Object, TObj>::value, "TObj expected to be derived from Object");

public:
    using TObjectPtr = TObj*;

    TSObjectOwner()
        : m_object(nullptr)
    {
    }

    ~TSObjectOwner()
    {
        clear();
    }

    TSObjectOwner(const TSObjectOwner& other)
        : m_object(other.m_object)
    {
    }

    TSObjectOwner& operator=(const TSObjectOwner& other)
    {
        clear();

        m_object = other.m_object;

        return *this;
    }

    TSObjectOwner(TSObjectOwner&& other)
    {
        takeOwnership(std::move(other));
    }

    TSObjectOwner& operator=(TSObjectOwner&& other) noexcept
    {
        takeOwnership(std::move(other));
        return *this;
    }

    const TObjectPtr& operator->() const noexcept
    {
        return *m_object.get();
    }

    long useCount() const
    {
        return m_object.use_count();
    }

    bool empty() const
    {
        return m_object.use_count() == 0;
    }

private:
    TSObjectOwner(TObj* obj)
        : m_object(std::make_shared<TObjectPtr>(obj))
    {
        LOG_ADDRESS("Creating lock wrapper ", m_object);
        Runtime::getGC()->addRootWithName(reinterpret_cast<Object**>(m_object.get()), "C++ side root wrapper");
    }

    void clear()
    {
        if (m_object && Runtime::isInitialized() && m_object.use_count() == 1)
        {
            LOG_ADDRESS("Removing lock wrapper ", this);
            Runtime::getGC()->removeRoot(reinterpret_cast<void**>(m_object.get()));
        }
    }

    void takeOwnership(TSObjectOwner&& other) noexcept
    {
        LOG_ADDRESS("Taking lock wrapper ownership ", this);
        clear();

        m_object = std::exchange(other.m_object, nullptr);
    }

    friend TSObjectOwner make_object_owner<TObj>(TObj* t);

private:
    std::shared_ptr<TObjectPtr> m_object;
};

template <class TObj>
TSObjectOwner<TObj> make_object_owner(TObj* obj)
{
    return TSObjectOwner<TObj>(obj);
}
