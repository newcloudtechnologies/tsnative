#pragma once

#include <iostream>

#ifdef ENABLE_LOGS

// Super simple logger, should be refactored
#define LOG_INFO(msg) std::cout << "[INFO] " << (msg) << std::endl
#define LOG_ADDRESS(msg, address) std::cout << "[LOG] " << (msg) << std::hex << ((void*)address) << std::endl
#define LOG_ADDRESS_WITH_SUFFIX(msg1, address, msg2) std::cout << "[LOG] " << (msg1) << std::hex << ((void*)address) << (msg2) << std::endl
#define LOG_ERROR(msg) std::cerr << "[ERROR] " << (msg) << std::endl;
#else

#define LOG_INFO(msg)
#define LOG_ADDRESS(msg, address)
#define LOG_ADDRESS_WITH_SUFFIX(msg1, address, msg2)
#define LOG_ERROR(msg)

#endif // ENABLE_LOGS