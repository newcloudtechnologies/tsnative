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

#include "std/private/algorithms.h"

#include <functional>
#include <type_traits>
#include <utility>
#include <vector>

template <typename TEmitterSource, typename... TEvents>
class EmitterBase
{
    // use on method
    template <typename TEvent>
    using Listener = std::function<void(TEvent& /* Event */, TEmitterSource& /* source */)>;

    template <typename TEvent>
    using Listeners = std::vector<Listener<TEvent>>;

protected:
    template <typename TEvent>
    const auto& handler() const noexcept
    {
        return std::get<Listeners<TEvent>>(_handlers);
    }

    template <typename TEvent>
    auto& handler() noexcept
    {
        return std::get<Listeners<TEvent>>(_handlers);
    }

public:
    EmitterBase() noexcept
    {
        static_assert(std::is_base_of<EmitterBase<TEmitterSource, TEvents...>, TEmitterSource>::value,
                      "TEmitterSource should be EmitterBase type");
    }
    virtual ~EmitterBase() noexcept = default;

    template <typename TEvent>
    void on(Listener<TEvent>&& listener)
    {
        handler<TEvent>().push_back(std::move(listener));
    }

    template <typename TEvent>
    void emit(TEvent event)
    {
        auto& listeners = handler<TEvent>();
        for (auto& listener : listeners)
        {
            listener(event, *static_cast<TEmitterSource*>(this));
        }
    }

    template <typename TEvent>
    void reset() noexcept
    {
        // Detach event U handlers
        handler<TEvent>().clear();
    }

    void reset() noexcept
    {
        forEachInTuple(_handlers, [](auto& listeners) { listeners.clear(); });
    }

    template <typename TEvent>
    bool has() const noexcept
    {
        return !(handler<TEvent>().empty());
    }

    template <typename TEvent>
    std::size_t getListenersCount() const
    {
        return handler<TEvent>().size();
    }

private:
    std::tuple<Listeners<TEvents>...> _handlers{};
};
