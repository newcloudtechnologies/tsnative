#include "std/tsobject.h"

#include "std/private/tsmap_p.h"
#include "std/private/tsobject_os.h"
#include "std/private/logger.h"

#include "std/tsboolean.h"
#include "std/tsmap.h"
#include "std/tsstring.h"
#include "std/tsarray.h"

#include "std/runtime.h"
#include "std/gc.h"

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

Object::~Object()
{
    delete _props;
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
    oss << this;
    return new String(oss.str());
}

Boolean* Object::toBool() const
{
    return new Boolean(true);
}

Array<String*>* Object::keys(Object* entity)
{
    return entity->getKeysArray();
}

std::vector<Object*> Object::getChildren() const
{
    std::vector<Object*> result;
    result.reserve(_props->size() * 2);

    const auto callable = [&result](const auto& entry)
    {
        auto* key = entry.first;
        auto* value = static_cast<Object*>(entry.second);

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

void* Object::operator new (std::size_t n)
{
    LOG_INFO("Calling Object new operator");

    // gc == nullptr can be if we allocate
    // static String* s = new String("adasd")
    if (!Runtime::isInitialized())
    {
        return :: operator new(n);
    }

    return Runtime::allocateObject(n);
}

class String;
template class Map<String*, void*>;
