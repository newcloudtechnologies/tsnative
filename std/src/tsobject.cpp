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

class String;
template class Map<String*, void*>;
