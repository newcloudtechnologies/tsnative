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
#include "std/tsobject.h"

#include "std/private/logger.h"

#include <memory>

template <typename TObj>
class TSObjectOwner;

template <typename TObj>
TSObjectOwner<TObj> make_object_owner(TObj* t);

template <typename TObj>
class TSObjectOwner : public Object
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

    TSObjectOwner(const TSObjectOwner& other) = delete;
    TSObjectOwner& operator=(TSObjectOwner& other) = delete;

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
        return m_object;
    }

    std::vector<Object*> getChildObjects() const override
    {
        return {m_object};
    }

    bool empty() const
    {
        return m_object == nullptr;
    }

private:
    TSObjectOwner(TObj* obj)
        : m_object(obj)
        , m_root(std::make_unique<Object*>())
    {
        LOG_ADDRESS("Creating lock wrapper ", this);
        *m_root = this;
        Runtime::getGC()->addRootWithName(m_root.get(), "C++ side root wrapper");
    }

    void clear()
    {
        LOG_ADDRESS("Removing lock wrapper ", this);
        if (m_root && Runtime::isInitialized())
        {
            Runtime::getGC()->removeRoot(reinterpret_cast<void**>(m_root.get()));
        }
    }

    void takeOwnership(TSObjectOwner&& other) noexcept
    {
        LOG_ADDRESS("Taking lock wrapper ownership ", this);
        clear();

        m_root = std::exchange(other.m_root, nullptr);
        m_object = std::exchange(other.m_object, nullptr);
        if (m_root)
        {
            *m_root = this;
        }
    }

    friend TSObjectOwner make_object_owner<TObj>(TObj* t);

private:
    TObj* m_object;
    std::unique_ptr<Object*> m_root;
};

template <class TObj>
TSObjectOwner<TObj> make_object_owner(TObj* obj)
{
    return TSObjectOwner<TObj>(obj);
}