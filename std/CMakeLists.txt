cmake_minimum_required(VERSION 3.10)
project(tsnative-std)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
    ${PROJECT_SOURCE_DIR}/include
)

set(SOURCES
    src/gc.cpp
    src/stdstring.cpp
    src/tsclosure.cpp
    src/tsnumber.cpp
)

if(DEFINED ENV{DEBUG})
    message(STATUS "Debug build")
    set(CMAKE_BUILD_TYPE Debug)
else()
    message(STATUS "Release build")
    set(CMAKE_BUILD_TYPE "Release")
endif()

add_library(${PROJECT_NAME}
    ${SOURCES}
)
