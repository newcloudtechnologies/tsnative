#include "std/tsobject.h"

#include "std/private/tsmap_p.h"
#include "std/private/logger.h"

#include "std/tsboolean.h"
#include "std/tsmap.h"
#include "std/tsstring.h"
#include "std/tsarray.h"
#include "std/tsunion.h"

#include "std/runtime.h"
#include "std/private/allocator.h"

#include "std/private/logger.h"

static String* superKey = new String("super");
static String* parentKey = new String("parent");

Object::Object()
#ifdef USE_MAP_STD_BACKEND
    : _props(new MapStdPrivate<String*, void*>())
#endif
{
    LOG_ADDRESS("Calling default object ctor ", this);
}

Object::Object(Map<String*, void*>* props)
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

bool Object::has(String* key) const
{
    return _props->has(key);
}

std::unordered_set<String*> Object::getUniqueKeys(const Object* o) const
{
    std::unordered_set<String*> uniqueKeys;
    if (!o || !o->_props) 
    {
        return uniqueKeys;
    }

    const auto isKeyShouldBeIgnored = [&superKeyCppStr = superKey->cpp_str(),
                                      &parentKeyCppStr = parentKey->cpp_str()]
                                     (const String* candidate)
    {
        static const std::unordered_set<std::string> keysToIgnore
        {
            superKeyCppStr,
            parentKeyCppStr
        };

        if (!candidate)
        {
            return true;
        }

        return keysToIgnore.find(candidate->cpp_str()) != keysToIgnore.cend();
    };

    const auto& keys = o->_props->orderedKeys();

    for (auto* key : keys)
    {
        if (isKeyShouldBeIgnored(key))
        {
            continue;
        }

        uniqueKeys.insert(key);
    }

    if (o->has(superKey))
    {
        auto* superObject = static_cast<Union*>(o->get(superKey))->getValue();
        auto superUniqueKeys = getUniqueKeys(superObject);

        // std::make_move_iterator will not help here.
        // uset iterators are const in fact
        // https://en.cppreference.com/w/cpp/container/unordered_set/begin
        // Because both iterator and const_iterator are constant iterators (and may in fact be the same type), 
        // it is not possible to mutate the elements of the container 
        // through an iterator returned by any of these member functions.
        uniqueKeys.insert(superUniqueKeys.begin(), superUniqueKeys.end());
    }

    return uniqueKeys;
}

Array<String*>* Object::getKeysArray() const
{
    auto uniqueKeys = getUniqueKeys(this);

    auto result = new Array<String*>();

    for (auto* s : uniqueKeys) 
    {
        result->push(s);
    }

    return result;
}

void* Object::get(String* key) const
{
    if (has(key))
    {
        return _props->get(key);
    }

    if (has(superKey))
    {
        auto superValue = static_cast<Union*>(get(superKey))->getValue();
        while (superValue)
        {
            if (superValue->has(key))
            {
                return superValue->get(key);
            }

            if (superValue->has(superKey))
            {
                superValue = static_cast<Union*>(superValue->get(superKey))->getValue();
            }
            else
            {
                superValue = nullptr;
            }
        }
    }

    auto optional = new Union();
    _props->set(key, optional);

    return optional;
}

void Object::set(String* key, void* value)
{
    auto optional = new Union(static_cast<Object*>(value));
    _props->set(key, optional);
}

void* Object::get(const std::string& key) const
{
    auto keyWrapped = new String(key);

    if (_props->has(keyWrapped))
    {
        return (static_cast<Union*>(_props->get(keyWrapped))->getValue());
    }

    auto optional = new Union();
    _props->set(keyWrapped, optional);
    return (optional->getValue());
}

void Object::set(const std::string& key, void* value)
{
    auto keyWrapped = new String(key);
    auto optional = new Union(static_cast<Object*>(value));
    _props->set(keyWrapped, optional);
}

String* Object::toString() const
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
        auto maybe = static_cast<const Union*>(_props->get(key));
        auto obj = maybe->getValue();

        if (isParent)
        {
            oss << "<recursive: " << size_t(obj) << ">";
        }
        else
        {
            oss << obj->toString();
        }

        oss << "\n";
    }

    depth--;
    oss << std::string(depth * PADDING_WIDTH, ' ') + "}";

    return new String(oss.str());
}

Boolean* Object::toBool() const
{
    return new Boolean(true);
}

Boolean* Object::equals(Object* other) const
{
    return new Boolean(other == this);
}

Array<String*>* Object::keys(Object* entity)
{
    return entity->getKeysArray();
}

void Object::copyPropsTo(Object* target)
{
    // @todo: handle 'super' key?
    _props->forEachEntry(
        [this, &target](const auto& pair)
        {
            target->set(pair.first, static_cast<Union*>(pair.second)->getValue());
        });
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

void Object::markChildren()
{
    LOG_ADDRESS("Calling OBJECT::markChildren on ", this);

    const auto callable = [](auto& entry)
    {
        auto* key = entry.first;
        auto* value = static_cast<Object*>(entry.second);

        if (key && !key->isMarked())
        {
            LOG_ADDRESS("Mark key child: ", key);
            key->mark();
        }
        if (value && !value->isMarked())
        {
            LOG_ADDRESS("Mark value child: ", value);
            value->mark();
        }
    };
    _props->forEachEntry(callable);

    LOG_INFO("Finished calling OBJECT::markChildren");
}

void* Object::operator new (std::size_t n)
{
    LOG_INFO("Calling Object new operator");

    // Runtime can be uninitialized if we allocate
    // static String* s = new String("adasd")
    if (!Runtime::isInitialized())
    {
        return :: operator new(n);
    }

    auto* allocator = Runtime::getAllocator();
    return allocator->allocateObject(static_cast<double>(n));
}

class String;
template class Map<String*, void*>;
