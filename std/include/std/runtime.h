#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <vector>

template<typename T>
class Array;

class String;

class TS_EXPORT TS_DECLARE Runtime : public Object
{
public:
    static void init(int argc, char* argv[]);
    static void destroy();
    
    static TS_METHOD Array<String*>* getCmdArgs();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    Runtime() = delete;

    static void checkInitialization();
    static void initCmdArgs(int ac, char* av[]);

    static std::vector<std::string> _cmdArgs;
    static bool _isInitialized;
};

inline std::ostream& operator<<(std::ostream& os, const Runtime* runtime)
{
    os << runtime->toString();
    return os;
}