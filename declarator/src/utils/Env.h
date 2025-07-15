#pragma once

#include <string>

namespace utils
{

std::string getEnv(const std::string& env);

/*
// TODO: is not available on Windows
void setEnv(const std::string& env, const std::string& value);
*/
} // namespace utils
