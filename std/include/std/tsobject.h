#pragma once

#include <TS.h>

#include <ostream>
#include <string>

class Boolean;
class String;

template <typename K, typename V>
class Map;

template <typename K, typename V>
class MapPrivate;

class TS_DECLARE Object
{
public:
    TS_METHOD TS_SIGNATURE("constructor(initializer?: any)") Object();
    Object(Map<String*, void*>* props);

protected:
    virtual ~Object();

public:
    TS_METHOD TS_SIGNATURE("get(key: string): any") void* get(String* key) const;
    TS_METHOD TS_SIGNATURE("set(key: string, value: any): void") void set(String* key, void* value);

    void* get(const std::string& key) const;
    void set(const std::string& key, void* value);

    template <typename T>
    T get(const std::string& key) const
    {
        static_assert(std::is_pointer<T>::value, "Expected T to be a pointer type");
        return static_cast<T>(get(key));
    }

    friend std::ostream& operator<<(std::ostream& os, const Object* o);

    TS_METHOD virtual String* toString() const;
    TS_METHOD virtual Boolean* toBool() const;

protected:
    MapPrivate<String*, void*>* _props = nullptr;
};
