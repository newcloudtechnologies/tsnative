/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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

private:
    Decorator(const std::string& name);
    void addArgument(const std::string& arg);

public:
    void print(generator::print::printer_t printer) const;

    template <typename... Args>
    static decorator_t make(const std::string& name, Args&&... args)
    {
        decorator_t result(new Decorator(name));
        ((result->addArgument(utils::toString(std::forward<Args>(args)))), ...);
        return result;
    }
};

} // namespace ts

} // namespace generator
