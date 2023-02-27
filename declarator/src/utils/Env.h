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

#include <string>

namespace utils
{

std::string getEnv(const std::string& env);

/*
// TODO: is not available on Windows
void setEnv(const std::string& env, const std::string& value);
*/
} // namespace utils
