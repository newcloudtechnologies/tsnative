#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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

get_filename_component(PROJECT_ENTRY_NAME ${PROJECT_ENTRY_NAME} ABSOLUTE)
get_filename_component(PROJECT_NAME ${PROJECT_ENTRY_NAME} NAME_WLE)
get_filename_component(PROJECT_BASE_URL ${PROJECT_BASE_URL} ABSOLUTE)

printvar(PROJECT_ENTRY_NAME)
printvar(PROJECT_NAME)
printvar(PROJECT_BASE_URL)

find_package(tsnative-declarator REQUIRED)
find_package(tsnative-std REQUIRED)

if (NOT CMAKE_CXX_STANDARD)
    set(CMAKE_CXX_STANDARD 14)
endif()

include(TsBuildUtils2.cmake)
include(TsDeclaratorUtils)

# TODO: extensions?
# TODO: TRACE_IMPORT
# TODO: PRINT_IR 
# TODO: TS_PROFILE_BUILD
# TODO: optimization level

# We can create add_ts_executable function that abstracts all the following code
# in TsBuildUtils2 and call it here but it's not clear if it would really be useful.
add_ts_library(ts
    SRC ${PROJECT_ENTRY_NAME}
    BASE_URL ${PROJECT_BASE_URL}
    TS_CONFIG ${TS_CONFIG}
    LIBRARIES ""
    INCLUDE_DIRS ${tsnative-std_INCLUDE_DIR}
    TS_DEBUG ${TS_DEBUG}
    RUN_EVENT_LOOP ${RUN_EVENT_LOOP}

    #PRINT_IR
)

add_executable(${PROJECT_NAME} WIN32 ${PROJECT_ENTRY_NAME})
target_link_libraries(${PROJECT_NAME} PRIVATE ts_main ts)

if (IS_TEST)
    enable_testing()
    add_test(
        NAME ${PROJECT_NAME}
        COMMAND ${PROJECT_NAME}
    )
endif()
