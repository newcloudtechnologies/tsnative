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
