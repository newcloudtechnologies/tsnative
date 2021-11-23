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

project(builder LANGUAGES CXX)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}")
list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/../std/cmake")

include("${CMAKE_CURRENT_LIST_DIR}/utils.cmake")

set(OPTIMIZATION_LEVEL "-O3")
set(EXTRA_DEPENDENCIES "")
set(INCLUDES )
set(DEFINITIONS )
set(LIBRARY_DEPENDENCIES )

add_custom_target(build_anyway ALL)

# build extensions from builder only
set(TS_EXTENSION_TARGET "exts")

if (NOT ${EXTENSION} STREQUAL "")
    include(${EXTENSION}/CMakeLists.txt)

    get_target_property(exts_INCLUDES ${TS_EXTENSION_TARGET} INCLUDES)
    get_target_property(exts_LIBRARY ${TS_EXTENSION_TARGET} OUTPUT)
    get_property(LIBRARY_DEPENDENCIES TARGET ${TS_EXTENSION_TARGET} PROPERTY LIBRARY_DEPENDENCIES)
    get_target_property(exts_HEADER_DEPENDENCIES ${TS_EXTENSION_TARGET} HEADER_DEPENDENCIES)
    get_target_property(EXTRA_DEPENDENCIES ${TS_EXTENSION_TARGET} EXTRA_DEPENDENCIES)
    get_property(DEFINITIONS TARGET ${TS_EXTENSION_TARGET} PROPERTY DEFINITIONS)

    list(FILTER exts_HEADER_DEPENDENCIES EXCLUDE REGEX "^/usr*")
    set(INCLUDES ${exts_INCLUDES} ${exts_HEADER_DEPENDENCIES})

    get_target_property(EXTRA_CMAKE ${TS_EXTENSION_TARGET} EXTRA_CMAKE)

    if (${EXTRA_CMAKE})
        include(${EXTRA_CMAKE})
    endif()
else()
    add_custom_target(${TS_EXTENSION_TARGET})
endif()

if (PRINT_IR)
    set(PRINT_IR TRUE)
else()
    set(PRINT_IR FALSE)
endif()

list(APPEND INCLUDES
    "${StdLib_INCLUDE_DIR}")

list(APPEND DEPENDENCIES
    "${exts_LIBRARY}"
    "${LIBRARY_DEPENDENCIES}"
    "${StdLib_LIBRARY}")

getProjectFiles("${ENTRY}" SOURCES)

build(binary_target ${TS_EXTENSION_TARGET} "${ENTRY}" "${SOURCES}" "${INCLUDES}" "${DEPENDENCIES}" "${EXTRA_DEPENDENCIES}" "${DEFINITIONS}" "${OPTIMIZATION_LEVEL}" FALSE "${PRINT_IR}")

add_dependencies(build_anyway ${binary_target})
