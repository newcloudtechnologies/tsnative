#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.10)

project(cpp_integration LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(tsnative-declarator REQUIRED)
find_package(tsnative-std REQUIRED)

include(TsBuildUtils2)

set(extTarget cpp_integration_exts)
add_subdirectory(cpp ${extTarget})

enable_testing()

if (NOT DEFINED CPP_INTEGRATION_TESTS_PATH)
    message(FATAL_ERROR "CPP_INTEGRATION_TESTS_PATH is not set") 
endif()

file(GLOB CPP_INTEGRATION_TESTS "${CPP_INTEGRATION_TESTS_PATH}/*.ts")

foreach(TEST_PATH IN LISTS CPP_INTEGRATION_TESTS)
    get_filename_component(TEST_NAME ${TEST_PATH} NAME_WLE)
    if (NOT ${TEST_NAME} MATCHES "${TEST_FILTER}")
        continue()
    endif()

    get_filename_component(TEST_FILENAME ${TEST_PATH} NAME)

    set (TS_TARGET ${TEST_NAME}_ts)
    add_ts_library(${TS_TARGET}
        SRC ${TEST_FILENAME}
        BASE_URL ${PROJECT_BASE_URL}
        TS_CONFIG tsconfig.json
        LIBRARIES ${extTarget}
        TS_DEBUG ${TS_DEBUG}
        RUN_EVENT_LOOP ${RUN_EVENT_LOOP}
        PRINT_IR ${PRINT_IR}
        TRACE_IMPORT ${TRACE_IMPORT}
    )

    add_executable(${TEST_NAME} WIN32 ${TEST_FILENAME})
    target_link_libraries(${TEST_NAME} PRIVATE ${TS_TARGET}_main ${TS_TARGET} ${extTarget})

    add_test(
        NAME ${TEST_NAME}
        COMMAND ${TEST_NAME}
    )
endforeach()