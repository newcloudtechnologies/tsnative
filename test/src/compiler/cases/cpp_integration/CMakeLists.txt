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

set(TESTS 
    aggregate.ts
    array_of_ambient_class_elements.ts
    closures.ts
    enum.ts
    generics.ts
    inher.ts
    nested_namespaces.ts
    optional_arguments.ts
    point.ts
    printable.ts
    union_narrowing.ts
    virtual_method_override.ts
)
foreach(TEST IN LISTS TESTS)
    get_filename_component(TEST_NAME ${TEST} NAME_WLE)
    get_filename_component(TEST_FILENAME ${TEST} NAME)
    set (TS_TARGET ${TEST_NAME}_ts)
    add_ts_library(${TS_TARGET}
        SRC ${TEST}
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