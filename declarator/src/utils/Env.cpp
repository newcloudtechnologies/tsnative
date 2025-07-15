#include "Env.h"

#include <cstdlib>

namespace utils
{

std::string getEnv(const std::string& env)
{
    char* value = std::getenv(env.c_str());
    return (value == NULL) ? "" : value;
}

/*
// TODO: is not available on Windows
void setEnv(const std::string& env, const std::string& value)
{
    setenv(env.c_str(), value.c_str(), 1);
}
*/

} // namespace utils
