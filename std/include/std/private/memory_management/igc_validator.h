#pragma once

class Object;

class IGCValidator
{
public:
    virtual ~IGCValidator() = default;

    virtual void validate() const = 0;

    virtual void onObjectAboutToDelete(void* obj) const = 0;
};