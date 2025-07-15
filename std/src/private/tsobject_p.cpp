#include <unordered_set>

#include <std/tsundefined.h>

#include <std/private/tsobject_p.h>

static constexpr auto superKeyCpp = "super";
static constexpr auto parentKeyCpp = "parent";

ObjectPrivate::ObjectPrivate()
{
    _properties = new MapStdPrivate<String*, Object*>;
}

ObjectPrivate::ObjectPrivate(TSTypeID typeId)
    : ObjectPrivate()
{
    _typeId = typeId;
}

TSTypeID ObjectPrivate::getTSTypeID() const
{
    return _typeId;
}

bool ObjectPrivate::has(String* key) const
{
    return _properties->has(key);
}

bool ObjectPrivate::has(const std::string& key) const
{
    String tsKey{key};
    return _properties->has(&tsKey);
}

std::vector<String*> ObjectPrivate::getKeys() const
{
    std::vector<String*> uniqueKeys;

    String superKey(superKeyCpp);
    if (has(&superKey))
    {
        auto* superObject = get(&superKey);
        std::vector<String*> superUniqueKeys = superObject->getKeys();
        uniqueKeys = std::move(superUniqueKeys);
    }

    // To process properties shadowing we need to search for super keys those are shadowed
    std::unordered_set<String*> superKeys(uniqueKeys.begin(), uniqueKeys.end());

    const std::vector<String*>& keys = _properties->orderedKeys();

    for (String* key : keys)
    {
        const std::string& keyCppStr = key->cpp_str();
        if (keyCppStr == superKeyCpp || keyCppStr == parentKeyCpp || superKeys.count(key))
        {
            continue;
        }

        uniqueKeys.push_back(key);
    }

    return uniqueKeys;
}

Object* ObjectPrivate::get(String* key) const
{
    if (has(key))
    {
        return _properties->get(key);
    }

    if (!has(superKeyCpp))
    {
        return Undefined::instance();
    }

    auto superValue = get(superKeyCpp);
    return superValue->get(key);
}

Object* ObjectPrivate::get(const std::string& key) const
{
    String tsKey{key};
    return get(&tsKey);
}

void ObjectPrivate::set(String* key, Object* value)
{
    _properties->set(key, value);
}

void ObjectPrivate::set(const std::string& key, Object* value)
{
    String* tsKey = new String{key};
    _properties->set(tsKey, value);
}

bool ObjectPrivate::operatorIn(String* key) const
{
    return operatorIn(key->cpp_str());
}

bool ObjectPrivate::operatorIn(const std::string& key) const
{
    // Local lookup O(1)
    if (has(key))
    {
        return true;
    }
    else if (has(superKeyCpp))
    {
        // Super lookup (linear)
        auto* superObject = get(superKeyCpp);
        return superObject->operatorIn(key);
    }

    return false;
}
