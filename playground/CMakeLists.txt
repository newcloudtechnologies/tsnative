#
# Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
#
# You can not use the contents of the file in any way without
# Laboratory of Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
# at http://cloudtechlab.ru/#contacts
#

cmake_minimum_required(VERSION 3.10)

project(tests LANGUAGES CXX)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../cmake")
list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/../node_modules/std-typescript-llvm/cmake")

find_package(StdLib REQUIRED)
find_package(Tsvmc REQUIRED)

# utils.cmake from tsvmc compiler
include(${Tsvmc_CMAKE_UTILS})

set(OPTIMIZATION_LEVEL "-O3")
set(EXTRA_DEPENDENCIES "")
set(INCLUDES )

add_custom_target(build_anyway ALL)

if (NOT ${EXTENSION} STREQUAL "")
    add_subdirectory(extension EXCLUDE_FROM_ALL)
    get_target_property(exts_INCLUDES exts INCLUDES)
    get_target_property(exts_LIBRARY exts OUTPUT)
    get_target_property(exts_DEPENDENCIES exts DEPENDENCIES)
    set(INCLUDES ${exts_INCLUDES})
else()
    add_custom_target(exts)
endif()

if (PRINT_IR)
    set(PRINT_IR TRUE)
else()
    set(PRINT_IR FALSE)
endif()

set(DEPENDENCIES
    ${StdLib_LIBRARY}
    ${exts_LIBRARY}
    ${exts_DEPENDENCIES})

build(binary_target exts "${SOURCE}" "${INCLUDES}" "${DEPENDENCIES}" "${EXTRA_DEPENDENCIES}" "${OPTIMIZATION_LEVEL}" FALSE "${PRINT_IR}")

add_dependencies(build_anyway ${binary_target})

