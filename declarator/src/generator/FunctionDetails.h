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

#include <string>
#include <vector>

namespace generator
{

namespace ts
{

struct ArgumentValue
{
    std::string name;
    std::string type;
    bool isSpread = false;
    bool isOptional = false;

public:
    ArgumentValue();
    ArgumentValue(const std::string& name, const std::string& type, bool isSpread = false, bool isOptional = false);

    std::string toString() const;
};

std::string formatArgumentList(const std::vector<ArgumentValue>& arguments);
std::string formatTemplateArgumentList(const std::vector<std::string>& templateArguments);
std::string formatReturnType(const std::string& retType);

} // namespace ts

} // namespace generator
