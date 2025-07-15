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

#ifdef VALIDATE_GC
#define LOG_GC(msg) std::cout << "[GC] " << (msg) << std::endl;
#define LOG_GC_ADDRESS(msg, address) std::cout << "[GC] " << (msg) << std::hex << ((void*)address) << std::endl
#else
#define LOG_GC(msg)
#define LOG_GC_ADDRESS(msg, address)
#endif
