#include "std/tsobject.h"

#include "std/private/tsmap_p.h"
#include "std/private/tsobject_os.h"

#include "std/tsboolean.h"
#include "std/tsmap.h"
#include "std/tsstring.h"
#include "std/tsarray.h"

static String* superKey = new String("super");
static String* parentKey = new String("parent");

Object::Object()
#ifdef USE_MAP_STD_BACKEND
    : _props(GC::track(new MapStdPrivate<String*, void*>()))
#endif
{
}

Object::Object(Map<String*, void*>* props)
    : _props(props->_d)
{
}

Object::~Object()
{
    // @todo untrack
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

    auto result = GC::track(new Array<String*>());

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

    auto optional = GC::track(new Union());
    _props->set(key, optional);

    return optional;
}

void Object::set(String* key, void* value)
{
    auto optional = GC::track(new Union(static_cast<Object*>(value)));
    _props->set(key, optional);
}

void* Object::get(const std::string& key) const
{
    auto keyWrapped = GC::track(new String(key));

    if (_props->has(keyWrapped))
    {
        return (static_cast<Union*>(_props->get(keyWrapped))->getValue());
    }

    auto optional = GC::track(new Union());
    _props->set(keyWrapped, optional);
    return (optional->getValue());
}

void Object::set(const std::string& key, void* value)
{
    auto keyWrapped = GC::track(new String(key));
    auto optional = GC::track(new Union(static_cast<Object*>(value)));
    _props->set(keyWrapped, optional);
}

String* Object::toString() const
{
    std::ostringstream oss;
    oss << this;
    return GC::track(new String(oss.str()));
}

Boolean* Object::toBool() const
{
    return GC::track(new Boolean(true));
}

Array<String*>* Object::keys(Object* entity)
{
    return entity->getKeysArray();
}

class String;
template class Map<String*, void*>;
