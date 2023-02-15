cmake_minimum_required(VERSION 3.10)
project(tsnative-std LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(GENERATE_DECLARATIONS "Allows generating TypeScript declarations" OFF)

find_package(absl)
find_package(libuv)
find_package(tsnative-declarator)
find_package(graphvizlib)

include(TsDeclaratorUtils)

# Declarator generates *.d.ts files from these headers
# Don't put headers from private folder there!
set(HEADERS
    include/std/tsobject.h
    include/std/tsundefined.h
    include/std/tsnull.h
    include/std/tsunion.h
    include/std/console.h
    include/std/iterable.h
    include/std/tsarray.h
    include/std/tsboolean.h
    include/std/tsmap.h
    include/std/tsnumber.h
    include/std/tsset.h
    include/std/tsstring.h
    include/std/tsdate.h
    include/std/tstuple.h
    include/std/tsclosure.h
    include/std/iterators/mapiterator.h
    include/std/iterators/setiterator.h
    include/std/iterators/stringiterator.h
    include/std/tsmath.h
    include/std/runtime.h
    include/std/gc.h
    include/std/diagnostics.h
    include/std/memory_diagnostics.h
    include/std/set_timeout.h
    include/std/set_interval.h
    include/std/event_loop.h
    include/std/tspromise.h
    include/std/parse_int.h
    include/std/parse_float.h)

set(SOURCES
    src/gc.cpp
    src/tsclosure.cpp
    src/tsdate.cpp
    src/tsmath.cpp
    src/tsnumber.cpp
    src/tsboolean.cpp
    src/tsundefined.cpp
    src/tsnull.cpp
    src/tsobject.cpp
    src/tstuple.cpp
    src/tsunion.cpp
    src/template_instances.cpp
    src/tsstring.cpp
    src/runtime.cpp
    src/diagnostics.cpp
    src/memory_diagnostics.cpp
    src/set_timeout.cpp
    src/set_interval.cpp
    src/event_loop.cpp
    src/tspromise.cpp
    src/parse_int.cpp
    src/parse_float.cpp
    src/timer_object.cpp
    src/id_generator.cpp

    src/private/libuv_wrapper/error_event.cpp
    src/private/libuv_wrapper/loop.cpp
    src/private/libuv_wrapper/timer_event_handler.cpp
    src/private/libuv_wrapper/async_event_handler.cpp
    src/private/tsboolean_cxx_builtin_p.cpp
    src/private/tsnumber_cxx_builtin_p.cpp
    src/private/tsstring_std_p.cpp
    src/private/tsdate_absl_p.cpp
    src/private/tsmath_p.cpp
    src/private/default_gc.cpp
    src/private/allocator.cpp
    src/private/memory_diagnostics_storage.cpp
    src/private/uv_loop_adapter.cpp
    src/private/uv_timer_adapter.cpp
    src/private/promise/promise_p.cpp
    src/private/promise/shared_promise_internal_state.cpp
    src/private/promise/promise_callback.cpp
    src/private/default_executor.cpp
    src/private/number_parser.cpp
    src/private/gc_printer.cpp
    src/private/gc_string_converter.cpp
    src/private/gc_names_storage.cpp
    src/private/uv_timer_creator.cpp)
    

if("${ENABLE_LOGS}" STREQUAL "all")
    add_definitions( -DENABLE_LOGS )
    add_definitions( -DENABLE_GC_LOGS )
elseif ("${ENABLE_LOGS}" STREQUAL "gc")
    add_definitions( -DENABLE_GC_LOGS )
endif()

add_library(${PROJECT_NAME}
    ${HEADERS} ${SOURCES} 
)

target_include_directories(${PROJECT_NAME}
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    PUBLIC
        "$<INSTALL_INTERFACE:$<INSTALL_PREFIX>/${CMAKE_INSTALL_INCLUDEDIR}>"
    INTERFACE
        "$<BUILD_INTERFACE:${PROJECT_SOURCE_DIR}/include>"
    )

target_link_libraries(${PROJECT_NAME}
    PUBLIC
        tsnative-declarator # for include path only
        absl::time # $<BUILD_INTERFACE:absl::time> ?
        absl::bad_optional_access
        absl::bad_variant_access
        uv_a
        graphvizlib
)

if (GENERATE_DECLARATIONS)
    set(IMPORT "")
    set(NO_IMPORT_STD "true")
    set(TS_SOURCES ${HEADERS})
    set(TS_DECLARATIONS )

    list(TRANSFORM TS_SOURCES PREPEND "${PROJECT_SOURCE_DIR}/")

    set_target_properties(${PROJECT_NAME} PROPERTIES
        TS_NO_IMPORT_STD "${NO_IMPORT_STD}"
    )

    ts_generate_declarations(${PROJECT_NAME}
        TS_HEADERS ${TS_SOURCES}
        TS_IMPORT "${IMPORT}"
        TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
        OUTPUT_DIR "${CMAKE_CURRENT_BINARY_DIR}"
        OUT_DECLARATIONS TS_DECLARATIONS
    )

    install(
        FILES ${TS_DECLARATIONS}
        DESTINATION "declarations/tsnative/std/definitions"
    )

    install(
        FILES definitions/lib.std.stubs.d.ts definitions/lib.std.numeric.d.ts
        DESTINATION "declarations/tsnative/std/definitions"
    )

else()
    install(
        DIRECTORY   definitions
        DESTINATION "declarations/tsnative/std"
    )
endif()

include(GNUInstallDirs)

# install headers
install(
    DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/include/std
    DESTINATION "${CMAKE_INSTALL_FULL_INCLUDEDIR}"
)

install(
    TARGETS ${PROJECT_NAME}
    EXPORT ${PROJECT_NAME}_export
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

install(
    EXPORT      ${PROJECT_NAME}_export
    FILE        ${PROJECT_NAME}Targets.cmake
    NAMESPACE   tsnative-std::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/${PROJECT_NAME}
)

install(
    FILES       ${PROJECT_NAME}Config.cmake
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/${PROJECT_NAME}
)

# keep this path for now to mimic structure hardcoded into declarator
install(
    DIRECTORY   decorators
    DESTINATION "declarations/tsnative/std"
)

if (BUILD_TEST)
    include (CTest)

    enable_testing()
    find_package(GTest REQUIRED)
    include(GoogleTest)

    set(TEST_HEADERS test/infrastructure/equality_checkers.h
                     test/infrastructure/test_allocator.h
                     test/infrastructure/global_test_allocator_fixture.h
                     test/infrastructure/object_wrappers.h
                     test/infrastructure/object_factory.h
                     test/mocks/mock_inline_executor.h
                     test/mocks/stub_event_loop.h)

    set(TEST_SOURCES test/infrastructure/equality_checkers.cpp
                     test/infrastructure/test_allocator.cpp
                     test/infrastructure/global_test_allocator_fixture.cpp
                     test/gc/treenode_gc_tests.cpp
                     test/gc/marking_tests.cpp
                     test/runtime_tests.cpp
                     test/event_loop/uv_loop_tests.cpp
                     test/event_loop/custom_loop_tests.cpp
                     test/event_loop/uv_timer_tests.cpp
                     test/primitive_types/string/replace_tests.cpp
                     test/primitive_types/number/unary.cpp
                     test/promise/expected_tests.cpp
                     test/promise/general_finite_state_machine_tests.cpp
                     test/infrastructure/promise_wrapper.cpp
                     test/promise/promise_tests.cpp
                     test/array/splice_impl_tests.cpp
                     test/array/splice_tests.cpp
                     test/mocks/stub_event_loop.cpp)

    add_executable(${PROJECT_NAME}_GTEST ${TEST_HEADERS} ${TEST_SOURCES})

    target_link_libraries(${PROJECT_NAME}_GTEST
                        PUBLIC
                            ${PROJECT_NAME}
                            GTest::gtest
                            GTest::gtest_main
                            GTest::gmock_main
                            GTest::gmock)

    gtest_add_tests(TARGET ${PROJECT_NAME}_GTEST)

    # https://stackoverflow.com/a/56116311
    if (FAIL_TESTS_ON_MEM_LEAK)
        add_custom_target(test_memcheck
                            COMMAND ${CMAKE_CTEST_COMMAND} 
                            --overwrite MemoryCheckCommandOptions=\"--leak-check=full --error-exitcode=1\" --test-action memcheck
                            WORKING_DIRECTORY "${CMAKE_BINARY_DIR}")
    else()
        add_custom_target(test_memcheck
                            COMMAND ${CMAKE_CTEST_COMMAND} 
                            --test-action memcheck 
                            WORKING_DIRECTORY "${CMAKE_BINARY_DIR}")
    endif()

endif()

