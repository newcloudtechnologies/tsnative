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

class Object;

class IGCValidator
{
public:
    virtual ~IGCValidator() = default;

    virtual void validate() const = 0;

    virtual void onObjectAboutToDelete(void* obj) const = 0;
};