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

#include <cassert>
#include <functional>
#include <memory>
#include <unordered_map>

template <typename Base, typename Key, typename... Args>
class FactoryFunctionsRegistry
{
public:
    using FactoryFunc = std::function<std::unique_ptr<Base>(Args...)>;

    FactoryFunctionsRegistry() = default;

    ~FactoryFunctionsRegistry() = default;

    template <typename Derived>
    void registerClass(const Key& key)
    {
        assert(!_storage.count(key) && "The storage entry already exists");
        _storage[key] = &constructDerived<Derived>;
    }

    void registerFactory(const Key& key, const FactoryFunc factory)
    {
        assert(!_storage.count(key) && "The storage entry already exists");
        _storage[key] = factory;
    }

    std::unique_ptr<Base> construct(const Key& key, Args... args)
    {
        auto it = _storage.find(key);
        assert(it != _storage.end() && "The storage entry already exists");
        const auto& factoryFn = it->second;
        return factoryFn(args...);
    }

private:
    template <typename Derived>
    static std::unique_ptr<Base> constructDerived(Args... args)
    {
        return std::make_unique<Derived>(std::forward<Args>(args)...);
    }

private:
    std::unordered_map<Key, FactoryFunc> _storage;
};

class ITimer;

template <typename TKey, typename... Args>
using TimerFactoryFunctionsRegistry = FactoryFunctionsRegistry<ITimer, TKey, Args...>;