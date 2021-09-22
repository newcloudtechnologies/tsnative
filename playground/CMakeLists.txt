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
list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/../std/cmake")

find_package(StdLib REQUIRED)
find_package(Tsvmc REQUIRED)

# utils.cmake from tsvmc compiler
include(${Tsvmc_CMAKE_UTILS})

set(OPTIMIZATION_LEVEL "-O3")
set(EXTRA_DEPENDENCIES "")
set(INCLUDES )
set(DEFINITIONS )
set(LIBRARY_DEPENDENCIES )

add_custom_target(build_anyway ALL)

if (NOT ${EXTENSION} STREQUAL "")
    add_subdirectory(extension EXCLUDE_FROM_ALL)
    get_target_property(exts_INCLUDES exts INCLUDES)
    get_target_property(exts_LIBRARY exts OUTPUT)
    get_property(LIBRARY_DEPENDENCIES TARGET exts PROPERTY LIBRARY_DEPENDENCIES)
    get_target_property(exts_HEADER_DEPENDENCIES exts HEADER_DEPENDENCIES)
    get_property(DEFINITIONS TARGET exts PROPERTY DEFINITIONS)
    set(INCLUDES ${exts_INCLUDES} ${exts_HEADER_DEPENDENCIES})
else()
    add_custom_target(exts)
endif()

if (PRINT_IR)
    set(PRINT_IR TRUE)
else()
    set(PRINT_IR FALSE)
endif()

list(APPEND INCLUDES
    "${StdLib_INCLUDE_DIR}")

set(DEPENDENCIES
    ${exts_LIBRARY}
    ${LIBRARY_DEPENDENCIES}
    ${StdLib_LIBRARY})

build(binary_target exts "${SOURCE}" "${INCLUDES}" "${DEPENDENCIES}" "${EXTRA_DEPENDENCIES}" "${DEFINITIONS}" "${OPTIMIZATION_LEVEL}" FALSE "${PRINT_IR}")

add_dependencies(build_anyway ${binary_target})

