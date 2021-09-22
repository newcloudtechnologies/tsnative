cmake_minimum_required(VERSION 3.10)
project(tsnative-std)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(cmake_include_current_dir on)
include_directories(${PROJECT_SOURCE_DIR}/include)

if(DEFINED ENV{DEBUG})
    message(STATUS "Debug build")
    set(CMAKE_BUILD_TYPE Debug)
else()
    message(STATUS "Release build")
    set(CMAKE_BUILD_TYPE "Release")
endif()

add_library(${PROJECT_NAME}
    src/console.cpp
    src/gc.cpp
    src/sizeof.cpp
    src/stdstring.cpp
    src/tsclosure.cpp
)

install(
    DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/include"
    DESTINATION "${CMAKE_INSTALL_PREFIX}/include/${PROJECT_NAME}"
    FILES_MATCHING
    PATTERN "*.h"
)