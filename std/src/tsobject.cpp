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

#include <unordered_set>

#include "std/private/tsobject_p.h"
#include "std/tsobject.h"

#include "std/private/logger.h"

#include "std/runtime.h"
#include "std/tsarray.h"
#include "std/tsboolean.h"
#include "std/tsmap.h"
#include "std/tsstring.h"

#include "std/private/memory_management/memory_manager.h"

static constexpr auto superKeyCpp = "super";
static constexpr auto parentKeyCpp = "parent";

Object::Object()
    : _d(new ObjectPrivate)
{
    LOG_ADDRESS("Calling default object ctor ", this);
}

Object::Object(TSTypeID typeId)
    : _d(new ObjectPrivate(typeId))
{
    LOG_ADDRESS("Calling object ctor with TypeID ", this);
}

Object::~Object()
{
    LOG_ADDRESS("Calling object dtor ", this);
    delete _d;
}

Boolean* Object::isUndefined_CompilerAPI() const
{
    return new Boolean(isUndefined());
}

bool Object::isObject() const
{
    return _d->getTSTypeID() == TSTypeID::Object;
}

bool Object::isUnion() const
{
    return _d->getTSTypeID() == TSTypeID::Union;
}

bool Object::isBoolean() const
{
    return _d->getTSTypeID() == TSTypeID::Boolean;
}

bool Object::isNumber() const
{
    return _d->getTSTypeID() == TSTypeID::Number;
}

bool Object::isString() const
{
    return _d->getTSTypeID() == TSTypeID::String;
}

bool Object::isUndefined() const
{
    return _d->getTSTypeID() == TSTypeID::Undefined;
}

bool Object::isNull() const
{
    return _d->getTSTypeID() == TSTypeID::Null;
}

bool Object::isArray() const
{
    return _d->getTSTypeID() == TSTypeID::Array;
}

bool Object::isTuple() const
{
    return _d->getTSTypeID() == TSTypeID::Tuple;
}

bool Object::isSet() const
{
    return _d->getTSTypeID() == TSTypeID::Set;
}

bool Object::isTimer() const
{
    return _d->getTSTypeID() == TSTypeID::Timer;
}

bool Object::isMap() const
{
    return _d->getTSTypeID() == TSTypeID::Map;
}

bool Object::isClosure() const
{
    return _d->getTSTypeID() == TSTypeID::Closure;
}

bool Object::isDate() const
{
    return _d->getTSTypeID() == TSTypeID::Date;
}

bool Object::isPromise() const
{
    return _d->getTSTypeID() == TSTypeID::Promise;
}

bool Object::isLazyClosure() const
{
    return _d->getTSTypeID() == TSTypeID::LazyClosure;
}

bool Object::isSameTypes(Object* object1, Object* object2)
{
    return object1->_d->getTSTypeID() == object2->_d->getTSTypeID();
}

bool Object::has(String* key) const
{
    return _d->has(key);
}

bool Object::has(const std::string& key) const
{
    return _d->has(key);
}

std::vector<String*> Object::getKeys() const
{
    return _d->getKeys();
}

Boolean* Object::operatorIn(String* key) const
{
    return new Boolean(_d->operatorIn(key));
}

bool Object::operatorIn(const std::string& key) const
{
    return _d->operatorIn(key);
}

Array<String*>* Object::getKeysArray() const
{
    return Array<String*>::fromStdVector(getKeys());
}

const Object* Object::getMostDerived() const
{
    String parentKey{parentKeyCpp};
    const Object* result = this;

    while (result->has(&parentKey))
    {
        result = result->get(&parentKey);
    }

    return result;
}

Object* Object::get(String* key) const
{
    LOG_INFO("Calling object::get for key " + key->cpp_str());

    return _d->get(key);
}

void Object::set(String* key, Object* value)
{
    _d->set(key, value);
}

Object* Object::get(const std::string& key) const
{
    return _d->get(key);
}

void Object::set(const std::string& key, Object* value)
{
    _d->set(key, value);
}

String* Object::toString() const
{
    return new String{"[object Object]"};
}

Boolean* Object::toBool() const
{
    return new Boolean(true);
}

Boolean* Object::equals(Object* other) const
{
    return new Boolean(_d == other->_d);
}

Array<String*>* Object::keys(Object* entity)
{
    return entity->getKeysArray();
}

void Object::copyPropsTo(Object* target)
{
    const Object* mostDerived = getMostDerived();

    String superKey(superKeyCpp);
    String parentKey(parentKeyCpp);

    mostDerived->_d->forEachProperty(
        [mostDerived, &target, &superKey, &parentKey](const auto& pair)
        {
            const auto& key = pair.first;

            if (key->cpp_str() == superKeyCpp)
            {
                mostDerived->get(&superKey)->set(&parentKey, target);
            }

            target->set(key, pair.second);
        });
}

std::vector<Object*> Object::getChildObjects() const
{
    std::vector<Object*> result;

    const auto callable = [&result](const std::pair<String*, Object*>& entry)
    {
        auto* key = entry.first;
        auto* value = entry.second;

        if (key)
        {
            result.push_back(key);
        }
        if (value)
        {
            result.push_back(value);
        }
    };

    _d->forEachProperty(callable);

    return result;
}

void* Object::operator new(std::size_t n)
{
    LOG_INFO("Calling Object new operator");

    // Runtime can be uninitialized if we allocate
    // static String* s = new String("adasd")
    if (!Runtime::isInitialized())
    {
        return ::operator new(n);
    }

    return Runtime::getMemoryManager()->allocateMemoryForObject(n);
}

#ifdef VALIDATE_GC
void Object::operator delete(void* ptr)
{
    if (Runtime::isInitialized() && Runtime::getMemoryManager())
    {
        Runtime::getMemoryManager()->onObjectAboutToDelete(ptr);
    }

    ::operator delete(ptr);
}
#endif
