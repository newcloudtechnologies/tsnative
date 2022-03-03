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

#include <clang-c/Index.h>

#include <string>
#include <vector>

namespace parser
{

class Diagnostics
{
    std::vector<std::string> fatal_errors;
    std::vector<std::string> errors;
    std::vector<std::string> warnings;

public:
    bool check() const;
    std::string print() const;

    static Diagnostics get(CXTranslationUnit unit);
};

} //  namespace parser
