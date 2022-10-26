#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

project(cpp_integration_exts LANGUAGES CXX)

find_package(tsnative-declarator REQUIRED)
find_package(tsnative-std REQUIRED)

include(TsDeclaratorUtils)

set(INCLUDES
    aggregate.h
    button.h
    component.h
    dummy_base.h
    enum.h
    fileinfo.h
    generics.h # TODO: header-only implementation doesn't work for now
    inheritance.h
    nested_namespaces.h
    optional_arguments.h
    point.h
    printable.h
    rect.h
    union_narrowing.h
)

set(SOURCES
    aggregate.cpp
    button.cpp
    component.cpp
    dummy_base.cpp
    enum.cpp
    fileinfo.cpp
    generics.cpp
    inheritance.cpp
    nested_namespaces.cpp
    optional_arguments.cpp
    point.cpp
    printable.cpp
    rect.cpp
    union_narrowing.cpp
)

list(TRANSFORM SOURCES PREPEND "${CMAKE_CURRENT_LIST_DIR}/")
list(TRANSFORM INCLUDES PREPEND "${CMAKE_CURRENT_LIST_DIR}/")

# Should be installed from Conan
get_filename_component(PROJECT_BASE_URL ${PROJECT_BASE_URL} ABSOLUTE)

add_library(${PROJECT_NAME} STATIC ${INCLUDES} ${SOURCES})

target_link_libraries(${PROJECT_NAME}
    PRIVATE
        tsnative-std::tsnative-std
)

set(TS_DECLARATIONS )

# FIXME: we dont need these properties any more, should be refatored
# to pass these values as arguments to ts_generate_* calls
set_target_properties(${PROJECT_NAME} PROPERTIES
    TS_HEADERS "${INCLUDES}"
    TS_INCLUDE_DIRECTORIES "${CMAKE_CURRENT_LIST_DIR}"
    TS_IMPORT ""
    TS_EXPORTED_NAME "exts, N2, innerNS, Button, Point, Rect, Aggregate, LargerAggregate, E, EnumArgs, DerivedFromVirtualBase, DerivedFromBaseInOtherNamespace, CXXBase, WithOptionalArgs, Printable, UnionTest, Component, AnotherWidget, Handler, ClassWithTemplateMethod, ClassWithTemplateMembers, TemplateClassWithTemplateMethod"
    TS_MODULE_NAME "cpp_integration"
    TS_DECLARATIONS_OUT_DIR "${PROJECT_BASE_URL}/{PROJECT_NAME}"
)

ts_generate_declarations(${PROJECT_NAME}
    TARGET_COMPILER_ABI ${CMAKE_CXX_COMPILER_TARGET}
    OUTPUT_DIR ${PROJECT_BASE_URL}/${PROJECT_NAME}
    OUT_DECLARATIONS TS_DECLARATIONS
)

# FIXME: do we really need two separate ts_generate_* functions?
# generate index.ts file
ts_generate_index(${PROJECT_NAME}
        DECLARATIONS ${TS_DECLARATIONS}
        OUT_DIRECTORY ${PROJECT_BASE_URL}/${PROJECT_NAME}
)
