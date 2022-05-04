#include <std/tsobject.h>

#include <std/private/tsmap_p.h>
#include <std/private/tsobject_os.h>

#include <std/tsboolean.h>
#include <std/tsmap.h>
#include <std/tsstring.h>

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

static String* superKey = new String("super");

#include <iostream>

void* Object::get(String* key) const
{
    if (has(key))
    {
        return _props->get(key);
    }

    if (has(superKey))
    {
        auto superValue = static_cast<Object*>(get(superKey));
        while (superValue)
        {
            if (superValue->has(key))
            {
                return superValue->get(key);
            }

            if (superValue->has(superKey))
            {
                superValue = static_cast<Object*>(superValue->get(superKey));
            }
            else
            {
                superValue = nullptr;
            }
        }
    }

    std::cout << "!!!!!!!! " << key << std::endl; 

    assert(false);

    auto optional = GC::track(new Union());
    _props->set(key, optional);

    return optional;
}

void Object::set(String* key, void* value)
{
    _props->set(key, value);
}

void* Object::get(const std::string& key) const
{
    auto keyWrapped = GC::track(new String(key));

    if (_props->has(keyWrapped))
    {
        return _props->get(keyWrapped);
    }

    auto optional = GC::track(new Union());
    _props->set(keyWrapped, optional);
    return (optional->getValue());
}

void Object::set(const std::string& key, void* value)
{
    auto keyWrapped = GC::track(new String(key));
    _props->set(keyWrapped, value);
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

class String;
template class Map<String*, void*>;
