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
project(cpp_exts LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(StdLib REQUIRED)

# For feature_summary()
include(FeatureSummary)
include(GNUInstallDirs) # provides CMAKE_INSTALL_* variables

include_directories(/Users/antiq/Downloads/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include)


set(INCLUDES
    button.h
    point.h
)

set(SOURCES
    button.cpp
    point.cpp
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
target_include_directories(${PROJECT_NAME} PUBLIC
    ${StdLib_INCLUDE_DIR}
)

