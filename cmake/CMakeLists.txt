#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.10)

project(builder LANGUAGES CXX)

macro (printvar NAME)
    message(STATUS "${NAME} = ${${NAME}}")
endmacro()

# include(CMakePrintSystemInformation)

if(IS_TEST)
    enable_testing()
endif()

# Convert provided paths into absolute
get_filename_component(TSNATIVE_ROOT ${TSNATIVE_ROOT} ABSOLUTE)
get_filename_component(PROJECT_ROOT ${PROJECT_ROOT} ABSOLUTE)
get_filename_component(PROJECT_BUILD_DIR ${PROJECT_BUILD_DIR} ABSOLUTE)
get_filename_component(PROJECT_OUTPUT_BINARY ${PROJECT_OUTPUT_BINARY} ABSOLUTE)
get_filename_component(PROJECT_ENTRY_NAME ${PROJECT_ENTRY_NAME} ABSOLUTE)
get_filename_component(PROJECT_BASE_URL ${PROJECT_BASE_URL} ABSOLUTE)

printvar(TSNATIVE_ROOT)
printvar(PROJECT_ROOT)
printvar(PROJECT_BUILD_DIR)
printvar(PROJECT_OUTPUT_BINARY)
printvar(PROJECT_ENTRY_NAME)
printvar(PROJECT_BASE_URL)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}")
list(APPEND CMAKE_PREFIX_PATH "${CMAKE_CURRENT_LIST_DIR}")

find_package(tsnative REQUIRED)

if (NOT CMAKE_CXX_STANDARD)
    set(CMAKE_CXX_STANDARD 14)
endif()

include(TsBuildUtils)
include(TsDeclaratorUtils)

add_custom_target(build_anyway ALL)

# FIXME? StdLib_INCLUDE_DIR point to ${TSNATIVE_ROOT}/include
# and helps to find declarator's TS.h
set (include_paths "${StdLib_INCLUDE_DIR}")

if (NOT ${PROJECT_TS_EXTENSION_DIR} STREQUAL "")
    message(STATUS "Loading extension from ${PROJECT_TS_EXTENSION_DIR}")

    # get last directory name which is extension's target
    get_filename_component(TS_EXTENSION_TARGET "${PROJECT_TS_EXTENSION_DIR}" NAME)
    add_subdirectory(${PROJECT_TS_EXTENSION_DIR} ${TS_EXTENSION_TARGET})

    get_target_property(exts_INCLUDES ${TS_EXTENSION_TARGET} INCLUDE_PATHS)
    get_target_property(exts_LIBRARY ${TS_EXTENSION_TARGET} OUTPUT)
    get_target_property(exts_LIBRARY_DEPENDENCIES ${TS_EXTENSION_TARGET} LIBRARY_DEPENDENCIES)
    get_target_property(exts_DEFINITIONS ${TS_EXTENSION_TARGET} DEFINITIONS)

#[[
    # TODO: why?
    get_target_property(EXTRA_CMAKE ${TS_EXTENSION_TARGET} EXTRA_CMAKE)
    if (${EXTRA_CMAKE})
        include(${EXTRA_CMAKE})
    endif()
]]
#    printvar(EXTRA_CMAKE)

    printvar(exts_INCLUDES)
    printvar(exts_LIBRARY)
    printvar(exts_LIBRARY_DEPENDENCIES)
    printvar(exts_DEFINITIONS)

    list (APPEND include_paths ${exts_INCLUDES})
else()
    set(TS_EXTENSION_TARGET fake)
    add_custom_target(${TS_EXTENSION_TARGET})
endif()

list(APPEND DEPENDENCIES
    "${exts_LIBRARY}"
    "${exts_LIBRARY_DEPENDENCIES}"
    "${StdLib_LIBRARY}")

build(binary_target ${TS_EXTENSION_TARGET} 
    "${PROJECT_ENTRY_NAME}"
    "${include_paths}"
    "${DEPENDENCIES}"
    "${exts_DEFINITIONS}"
    "-O3"
    ${IS_TEST}
    "${PRINT_IR}")

add_dependencies(build_anyway ${binary_target})
