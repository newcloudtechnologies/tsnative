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

#include <iostream>

#if defined(__GNUC__) || defined(__clang__)
#define CURRENT_FUNCTION __PRETTY_FUNCTION__
#elif defined(_MSC_VER)
#define CURRENT_FUNCTION __FUNCSIG__
#endif

#ifdef ENABLE_LOGS

// Super simple logger, should be refactored
#define LOG_INFO(msg) std::cout << "[INFO] " << (msg) << std::endl
#define LOG_ADDRESS(msg, address) std::cout << "[LOG] " << (msg) << std::hex << ((void*)address) << std::endl
#define LOG_ERROR(msg) std::cerr << "[ERROR] " << (msg) << std::endl;
#define LOG_METHOD_CALL LOG_INFO(CURRENT_FUNCTION);
#else

#define LOG_INFO(msg)
#define LOG_ADDRESS(msg, address)
#define LOG_ERROR(msg)
#define LOG_METHOD_CALL

#endif // ENABLE_LOGS