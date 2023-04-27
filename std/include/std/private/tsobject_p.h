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

#include <std/tsobject.h>

#include <std/private/tsmap_std_p.h>

class ObjectPrivate
{
public:
    ObjectPrivate();
    ObjectPrivate(TSTypeID typeId);

    ObjectPrivate(const ObjectPrivate&) = delete;

    TSTypeID getTSTypeID() const;

    bool has(String* key) const;
    bool has(const std::string& key) const;

    std::vector<String*> getKeys() const;

    Object* get(String* key) const;
    Object* get(const std::string& key) const;

    void set(String* key, Object* value);
    void set(const std::string& key, Object* value);

    template <typename Visitor>
    void forEachProperty(Visitor&& visitor) const
    {
        _properties->forEachEntry(visitor);
    }

    bool operatorIn(String* key) const;
    bool operatorIn(const std::string& key) const;

private:
    MapStdPrivate<String*, Object*>* _properties = nullptr;
    TSTypeID _typeId = TSTypeID::Object;
};