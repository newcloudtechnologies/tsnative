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

#include <TS.h>

#include <ostream>
#include <string>
#include <vector>

class Boolean;
class String;

template <typename T>
class Array;

template <typename K, typename V>
class Map;

template <typename K, typename V>
class MapPrivate;

class ToStringConverter;

enum class TSTypeID
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
    Promise = 1 << 16,
    Timer = 1 << 17,
    LazyClosure = 1 << 18,
};

class TS_DECLARE Object
{
public:
    TS_METHOD TS_SIGNATURE("constructor(initializer?: any)") Object();
    Object(Map<String*, Object*>* props);
    Object(TSTypeID typeId);

    virtual ~Object();

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
    bool isPromise() const;
    bool isTimer() const;
    bool isLazyClosure() const;

protected:
    bool has(String* key) const;
    virtual Array<String*>* getKeysArray() const;
    TS_METHOD Boolean* operatorIn(String* key) const;

public:
    TS_METHOD Boolean* isUndefined_CompilerAPI() const;

    TS_METHOD TS_SIGNATURE("get(key: string): Object") Object* get(String* key) const;
    TS_METHOD TS_SIGNATURE("set(key: string, value: Object): void") void set(String* key, Object* value);

    Object* get(const std::string& key) const;
    void set(const std::string& key, void* value);

    template <typename T>
    T get(const std::string& key) const
    {
        static_assert(std::is_pointer<T>::value, "Expected T to be a pointer type");
        return static_cast<T>(get(key));
    }

    // virtual because compiler tries to find it using vtable
    TS_METHOD virtual String* toString() const;

    TS_METHOD virtual Boolean* toBool() const;

    TS_METHOD virtual Boolean* equals(Object* other) const;

    TS_METHOD static Array<String*>* keys(Object* entity);

    TS_METHOD void copyPropsTo(Object* target);

    virtual std::vector<Object*> getChildObjects() const;

    template <typename T>
    static Object* asObjectPtr(T value)
    {
        /*
        hard cast 'value' to Object
        std's containers may contain forward declared types so it's impossible to use static_cast and perform any static
        checks use reinterpret_cast in assumption that T is a pointer of class derived from Object
        */
        return reinterpret_cast<Object*>(value);
    }

    template <typename T>
    static Object** asObjectPtrPtr(T value)
    {
        /*
        hard cast 'value' to Object
        std's containers may contain forward declared types so it's impossible to use static_cast and perform any static
        checks use reinterpret_cast in assumption that T is a pointer of class derived from Object
        */
        return reinterpret_cast<Object**>(value);
    }

    void* operator new(std::size_t n);

#ifdef VALIDATE_GC
    void operator delete(void* ptr);
#endif

    std::vector<String*> getKeys() const;

private:
    MapPrivate<String*, Object*>* _props = nullptr;

    TSTypeID _typeid = TSTypeID::Object;

private:
    friend class ToStringConverter;
};
