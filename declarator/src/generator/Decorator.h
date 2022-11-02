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

#pragma once

#include "Printer.h"
#include "utils/Strings.h"

#include <memory>
#include <string>
#include <vector>

namespace generator
{

namespace ts
{

class Decorator;
using decorator_t = std::shared_ptr<Decorator>;
using decorator_list_t = std::vector<decorator_t>;

class Decorator
{
private:
    std::string m_name;
    std::vector<std::string> m_arguments;
    bool m_ignored = false;

private:
    Decorator(const std::string& name, bool ignored);

public:
    void addArgument(int arg);
    void addArgument(double arg);
    void addArgument(const char* arg);

    void print(generator::print::printer_t printer) const;

    template <typename... Args>
    static decorator_t make(const std::string& name, Args&&... args)
    {
        decorator_t result(new Decorator(name, true));
        ((result->addArgument(std::forward<Args>(args))), ...);
        return result;
    }

    template <typename... Args>
    static decorator_t makeWithoutIgnore(const std::string& name, Args&&... args)
    {
        decorator_t result(new Decorator(name, false));
        ((result->addArgument(std::forward<Args>(args))), ...);
        return result;
    }

    static decorator_t fromString(const std::string& s);
};

} // namespace ts

} // namespace generator
