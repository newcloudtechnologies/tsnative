#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.13)

project(CXXPoint LANGUAGES C CXX)

set(HEADERS include/point.h)

set(SOURCES src/point.cpp)

list(TRANSFORM SOURCES PREPEND "${CMAKE_CURRENT_LIST_DIR}/")
list(TRANSFORM HEADERS PREPEND "${CMAKE_CURRENT_LIST_DIR}/")

add_library(${PROJECT_NAME} STATIC ${HEADERS} ${SOURCES})

target_include_directories(${PROJECT_NAME} PUBLIC include)

target_link_libraries(${PROJECT_NAME}
    PUBLIC
        tsnative-std::tsnative-std
)

set(TS_DECLARATIONS_OUT_DIR ${PROJECT_BASE_URL}/declarations/${PROJECT_NAME})

set(TS_DECLARATIONS )
ts_generate_declarations(${PROJECT_NAME}
    TS_HEADERS ${HEADERS}
    TARGET_COMPILER_ABI "${CONAN_TARGET_ABI}"
    OUTPUT_DIR "${TS_DECLARATIONS_OUT_DIR}"
    OUT_DECLARATIONS TS_DECLARATIONS
)

add_extension(${PROJECT_NAME})
copy_to_node_modules_after_build(${PROJECT_NAME} ${TS_DECLARATIONS_OUT_DIR} ${PROJECT_NAME})
