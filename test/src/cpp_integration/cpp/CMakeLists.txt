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
project(cpp_integration_exts LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(StdLib REQUIRED)

# For feature_summary()
include(FeatureSummary)
include(GNUInstallDirs) # provides CMAKE_INSTALL_* variables

get_filename_component(STDLIB_INCLUDE_DIR
                       "${StdLib_INCLUDE_DIR}/../.."
                       ABSOLUTE)

include_directories(
    ${STDLIB_INCLUDE_DIR}
)

set(INCLUDES
    aggregate.h
    rect.h
    acceptor.h
    point.h
    printable.h
    dummy_base.h
    inheritance.h
)

set(SOURCES
    aggregate.cpp
    nested_namespaces.cpp
    point.cpp
    rect.cpp
    acceptor.cpp
    generics.cpp
    printable.cpp
    dummy_base.cpp
    inheritance.cpp
)

feature_summary(WHAT ALL INCLUDE_QUIET_PACKAGES FATAL_ON_MISSING_REQUIRED_PACKAGES)

add_library(${PROJECT_NAME}
    ${INCLUDES}
    ${SOURCES}
)

set_target_properties(${PROJECT_NAME} PROPERTIES
  INCLUDES "${CMAKE_CURRENT_SOURCE_DIR}"
)

set_target_properties(${PROJECT_NAME} PROPERTIES
  OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/${CMAKE_STATIC_LIBRARY_PREFIX}${PROJECT_NAME}${CMAKE_STATIC_LIBRARY_SUFFIX}"
)

set_target_properties(${PROJECT_NAME} PROPERTIES
  DEPENDENCIES "${StdLib_LIBRARY}"
)

target_link_libraries(${PROJECT_NAME})

