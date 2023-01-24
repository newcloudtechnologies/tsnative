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

#include <unordered_set>

#include "std/tsobject.h"

#include "std/private/logger.h"
#include "std/private/to_string_impl.h"
#include "std/private/tsmap_p.h"

#include "std/tsarray.h"
#include "std/tsboolean.h"
#include "std/tsmap.h"
#include "std/tsstring.h"

#include "std/private/allocator.h"
#include "std/runtime.h"

#include "std/private/logger.h"

static String* superKey = new String("super");
static String* parentKey = new String("parent");

Object::Object()
#ifdef USE_MAP_STD_BACKEND
    : _props(new MapStdPrivate<String*, Object*>())
#endif
{
    LOG_ADDRESS("Calling default object ctor ", this);
}

Object::Object(Map<String*, Object*>* props)
    : _props(props->_d)
{
    LOG_ADDRESS("Calling object ctor with props ", this);
}

Object::Object(TSTypeID typeId)
    : Object()
{
    _typeid = typeId;

    LOG_ADDRESS("Calling object ctor with TypeID ", this);
}

Object::~Object()
{
    LOG_ADDRESS("Calling object dtor ", this);
    delete _props;
}

bool Object::isObject() const
{
    return _typeid == TSTypeID::Object;
}

bool Object::isUnion() const
{
    return _typeid == TSTypeID::Union;
}

bool Object::isBoolean() const
{
    return _typeid == TSTypeID::Boolean;
}

bool Object::isNumber() const
{
    return _typeid == TSTypeID::Number;
}

bool Object::isString() const
{
    return _typeid == TSTypeID::String;
}

bool Object::isUndefined() const
{
    return _typeid == TSTypeID::Undefined;
}

bool Object::isNull() const
{
    return _typeid == TSTypeID::Null;
}

bool Object::isArray() const
{
    return _typeid == TSTypeID::Array;
}

bool Object::isTuple() const
{
    return _typeid == TSTypeID::Tuple;
}

bool Object::isSet() const
{
    return _typeid == TSTypeID::Set;
}

bool Object::isMap() const
{
    return _typeid == TSTypeID::Map;
}

bool Object::isClosure() const
{
    return _typeid == TSTypeID::Closure;
}

bool Object::isDate() const
{
    return _typeid == TSTypeID::Date;
}

bool Object::isPromise() const
{
    return _typeid == TSTypeID::Promise;
}

bool Object::has(String* key) const
{
    return _props->has(key);
}

std::vector<String*> Object::getKeys() const
{
    std::vector<String*> uniqueKeys;

    const std::string& superKeyCppStr = superKey->cpp_str();
    const std::string& parentKeyCppStr = parentKey->cpp_str();

    if (has(superKey))
    {
        auto* superObject = get(superKey);
        std::vector<String*> superUniqueKeys = superObject->getKeys();
        uniqueKeys.insert(uniqueKeys.end(),
                          std::make_move_iterator(superUniqueKeys.begin()),
                          std::make_move_iterator(superUniqueKeys.end()));
    }

    // To process properties shadowing we need to search for super keys those are shadowed
    std::unordered_set<String*> superKeys(uniqueKeys.begin(), uniqueKeys.end());

    const std::vector<String*>& keys = _props->orderedKeys();

    for (String* key : keys)
    {
        const std::string& keyCppStr = key->cpp_str();
        if (keyCppStr == superKeyCppStr || keyCppStr == parentKeyCppStr || superKeys.count(key))
        {
            continue;
        }

        uniqueKeys.push_back(key);
    }

    return uniqueKeys;
}

Boolean* Object::operatorIn(String* key) const
{
    // Local lookup O(1)
    if (has(key))
    {
        return new Boolean(true);
    }
    else if (has(superKey))
    {
        // Super lookup (linear)
        std::string keyCppStr = key->cpp_str();
        auto* superObject = get(superKey);
        return superObject->operatorIn(key);
    }
    return new Boolean(false);
}

Array<String*>* Object::getKeysArray() const
{
    return Array<String*>::fromStdVector(getKeys());
}

Object* Object::get(String* key) const
{
    LOG_INFO("Calling object::get for key " + key->cpp_str());

    if (has(key))
    {
        return _props->get(key);
    }

    if (has(superKey))
    {
        auto superValue = get(superKey);
        while (superValue)
        {
            if (superValue->has(key))
            {
                return superValue->get(key);
            }

            if (superValue->has(superKey))
            {
                superValue = superValue->get(superKey);
            }
            else
            {
                superValue = nullptr;
            }
        }
    }

    return Undefined::instance();
}

void Object::set(String* key, Object* value)
{
    _props->set(key, value);
}

Object* Object::get(const std::string& key) const
{
    // @todo: this method should behave as Object::get(String* key)
    auto keyWrapped = new String(key);

    if (_props->has(keyWrapped))
    {
        return _props->get(keyWrapped);
    }

    return Undefined::instance();
}

void Object::set(const std::string& key, void* value)
{
    auto keyWrapped = new String(key);

    _props->set(keyWrapped, static_cast<Object*>(value));
}

std::string Object::toStdString() const
{
    std::ostringstream oss;

    const auto& keys = _props->orderedKeys();

    static size_t depth = 0;
    static const int8_t PADDING_WIDTH = 2;

    oss << size_t(this) << ": {\n";

    ++depth;

    for (const auto& key : keys)
    {
        oss << std::string(depth * PADDING_WIDTH, ' ') << key << ":";

        bool isParent = key->equals(parentKey)->unboxed();
        auto obj = static_cast<const Object*>(_props->get(key));

        if (isParent)
        {
            oss << "<recursive: " << size_t(obj) << ">";
        }
        else
        {
            oss << obj->toStdString();
        }

        oss << "\n";
    }

    depth--;
    oss << std::string(depth * PADDING_WIDTH, ' ') + "}";

    return oss.str();
}

DEFAULT_TO_STRING_IMPL(Object);

Boolean* Object::toBool() const
{
    return new Boolean(true);
}

Boolean* Object::equals(Object* other) const
{
    // Consider Object as properties map wrapper
    return new Boolean(other->_props == _props);
}

Array<String*>* Object::keys(Object* entity)
{
    return entity->getKeysArray();
}

void Object::copyPropsTo(Object* target)
{
    // @todo: handle 'super' key?
    _props->forEachEntry([this, &target](const auto& pair) { target->set(pair.first, pair.second); });
}

bool Object::isMarked() const
{
    return _isMarked;
}

void Object::mark()
{
    _isMarked = true;
    markChildren();
}

void Object::unmark()
{
    _isMarked = false;
}

std::vector<Object*> Object::getChildObjects() const
{
    std::vector<Object*> result;
    result.reserve(_props->size());

    const auto callable = [&result](auto& entry)
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

    _props->forEachEntry(callable);

    return result;
}

void Object::markChildren()
{
    LOG_ADDRESS("Calling OBJECT::markChildren on ", this);
    auto children = getChildObjects();
    for (auto* c : children)
    {
        if (!c->isMarked())
        {
            c->mark();
        }
    }

    LOG_INFO("Finished calling OBJECT::markChildren");
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

    auto* allocator = Runtime::getAllocator();
    return allocator->allocateObject(static_cast<double>(n));
}

class String;
template class Map<String*, Object*>;
