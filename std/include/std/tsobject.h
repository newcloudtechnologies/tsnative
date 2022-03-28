#pragma once

#include <ostream>
#include <string>

class Boolean;
class String;

template <typename K, typename V>
class Map;

template <typename K, typename V>
class MapPrivate;

class Object
{
public:
    Object();
    Object(Map<String*, void*>* props);

protected:
    virtual ~Object();

public:
    void* get(String* key) const;
    void set(String* key, void* value);

    void* get(const std::string& key) const;
    void set(const std::string& key, void* value);

    template <typename T>
    T get(const std::string& key) const
    {
        static_assert(std::is_pointer<T>::value, "Expected T to be a pointer type");
        return static_cast<T>(get(key));
    }

    friend std::ostream& operator<<(std::ostream& os, const Object* o);

    virtual String* toString() const;
    virtual Boolean* toBool() const;

protected:
    MapPrivate<String*, void*>* _props = nullptr;
};
