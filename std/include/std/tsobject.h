#pragma once

#include <TS.h>

#include <ostream>
#include <string>
#include <unordered_set>

class Boolean;
class String;

template <typename T>
class Array;

template <typename K, typename V>
class Map;

template <typename K, typename V>
class MapPrivate;

class TS_DECLARE Object
{
    friend class Union;
    friend class Boolean;
    friend class Number;
    friend class String;
    friend class Undefined;
    friend class Null;
    
    template <typename T>
    friend class Array;

    friend class Tuple;

    template <typename T>
    friend class Set;

    template <typename K, typename V>
    friend class Map;

    friend class TSClosure;
    friend class Date;

protected:
    enum class TypeID
    {
        Object = 1 << 3,
        Union = 1 << 4,
        Boolean = 1 << 5,
        Number = 1 << 6,
        String = 1 << 7,
        Undefined = 1 << 8,
        Null = 1 << 9,
        Array = 1 << 10,
        Tuple = 1 << 11,
        Set = 1 << 12,
        Map = 1 << 13,
        Closure = 1 << 14,
        Date = 1 << 15,
    };

public:
    TS_METHOD TS_SIGNATURE("constructor(initializer?: any)") Object();
    Object(Map<String*, void*>* props);

    virtual ~Object();

protected:
    bool isObject() const;
    bool isUnion() const;
    bool isBoolean() const;
    bool isNumber() const;
    bool isString() const;
    bool isUndefined() const;
    bool isNull() const;
    bool isArray() const;
    bool isTuple() const;
    bool isSet() const;
    bool isMap() const;
    bool isClosure() const;
    bool isDate() const;

    bool has(String* key) const;

    virtual Array<String*>* getKeysArray() const;

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

    TS_METHOD TS_DECORATOR("Virtual") virtual String* toString() const;
    TS_METHOD TS_DECORATOR("Virtual") virtual Boolean* toBool() const;

    TS_METHOD TS_DECORATOR("Virtual") virtual Boolean* equals(Object* other) const;

    TS_METHOD static Array<String*>* keys(Object* entity);

    TS_METHOD void copyPropsTo(Object* target);

    bool isMarked() const;
    void mark();
    void unmark();

    virtual void markChildren();

    void* operator new(std::size_t n);

protected:
    MapPrivate<String*, void*>* _props = nullptr;

    TypeID _typeid = TypeID::Object;

private:
    std::unordered_set<String*> getUniqueKeys(const Object* o) const;
    bool _isMarked = false;
};
