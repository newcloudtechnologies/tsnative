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

enable_testing()

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/../cmake")
list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_LIST_DIR}/../std/cmake")

include("${CMAKE_CURRENT_LIST_DIR}/../cmake/utils.cmake")

if (NOT DEFINED SOURCES)
    # looking for all test cases
    file(GLOB_RECURSE SOURCES RELATIVE "${CMAKE_CURRENT_LIST_DIR}" "*.ts")
    list(FILTER SOURCES EXCLUDE REGEX ".*[.]d.ts$")
    list(FILTER SOURCES EXCLUDE REGEX ".*runtime_test.ts$")
endif()

if (NOT DEFINED SRCDIR)
    set(SRCDIR
        ${CMAKE_CURRENT_LIST_DIR})
endif()

set(OPTIMIZATION_LEVEL "-O3")
set(EXTRA_DEPENDENCIES "")

add_custom_target(build_anyway ALL)

list(LENGTH SOURCES count)
set(index 0)
while(index LESS ${count})
    list (GET SOURCES ${index} ENTRY)

    if (ENTRY STREQUAL "src/cpp_closures/cpp_closures.ts")
        if (NOT TARGET cpp_exts)
            add_subdirectory("src/cpp_closures/cpp" EXCLUDE_FROM_ALL)
        endif()

        get_target_property(cpp_exts_INCLUDES cpp_exts INCLUDES)
        get_target_property(cpp_exts_DEPENDENCIES cpp_exts DEPENDENCIES)
        get_target_property(cpp_exts_LIBRARY cpp_exts OUTPUT)
        get_property(DEFINITIONS TARGET cpp_exts PROPERTY DEFINITIONS)

        set(INCLUDES "${cpp_exts_INCLUDES}")
        set(DEPENDENCIES
            ${StdLib_LIBRARY}
            ${cpp_exts_LIBRARY}
            ${cpp_exts_DEPENDENCIES})

        list(APPEND INCLUDES
            "${StdLib_INCLUDE_DIR}")

        build(binary_target${index} cpp_exts "${ENTRY}" "${SOURCES}" "${INCLUDES}" "${DEPENDENCIES}" "${EXTRA_DEPENDENCIES}" "${DEFINITIONS}" "${OPTIMIZATION_LEVEL}" TRUE FALSE)
        add_dependencies(build_anyway "${binary_target${index}}")

    elseif(ENTRY MATCHES "^src/cpp_integration/")
        if (NOT TARGET cpp_integration_exts)
            add_subdirectory("src/cpp_integration/cpp" EXCLUDE_FROM_ALL)
        endif()

        set(DEFINITIONS )

        get_target_property(cpp_exts_INCLUDES cpp_integration_exts INCLUDES)
        get_target_property(cpp_exts_DEPENDENCIES cpp_integration_exts DEPENDENCIES)
        get_target_property(cpp_exts_LIBRARY cpp_integration_exts OUTPUT)
        get_property(DEFINITIONS TARGET cpp_integration_exts PROPERTY DEFINITIONS)

        set(INCLUDES "${cpp_exts_INCLUDES}")
        set(DEPENDENCIES
            ${StdLib_LIBRARY}
            ${cpp_exts_LIBRARY}
            ${cpp_exts_DEPENDENCIES})

        list(APPEND INCLUDES
            "${StdLib_INCLUDE_DIR}")

        build(binary_target${index} cpp_integration_exts "${ENTRY}" "${SOURCES}" "${INCLUDES}" "${DEPENDENCIES}" "${EXTRA_DEPENDENCIES}" "${DEFINITIONS}" "${OPTIMIZATION_LEVEL}" TRUE FALSE)
        add_dependencies(build_anyway "${binary_target${index}}")

    else()
        if (NOT TARGET init_target)
            add_custom_target(init_target)
        endif()

        set(INCLUDES )
        set(DEFINITIONS )
        set(DEPENDENCIES
            ${StdLib_LIBRARY})

        list(APPEND INCLUDES
            "${StdLib_INCLUDE_DIR}")

        build(binary_target${index} init_target "${ENTRY}" "${SOURCES}" "${INCLUDES}" "${DEPENDENCIES}" "${EXTRA_DEPENDENCIES}" "${DEFINITIONS}" "${OPTIMIZATION_LEVEL}" TRUE FALSE)
        add_dependencies(build_anyway "${binary_target${index}}")
    endif()

    math(EXPR index "${index}+1")
endwhile()

