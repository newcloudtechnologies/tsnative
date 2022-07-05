#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
# 
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
# 
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.12)

project(tsnative-declarator LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(LLVM "11.1.0" REQUIRED CONFIG)

message(STATUS "LLVM_CMAKE_DIR=${LLVM_CMAKE_DIR}")
message(STATUS "LLVM_INCLUDE_DIRS=${LLVM_INCLUDE_DIRS}")
message(STATUS "LLVM_LIBRARY_DIRS=${LLVM_LIBRARY_DIRS}")

# Add path to LLVM modules
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${LLVM_CMAKE_DIR}")

# import LLVM CMake functions
include(AddLLVM)

set(SOURCES
    src/main.cpp
    )

include_directories(${LLVM_INCLUDE_DIRS})
include_directories(src)

link_directories(${LLVM_LIBRARY_DIRS})

add_definitions(${LLVM_DEFINITIONS})

add_subdirectory(src/parser)
add_subdirectory(src/generator)
add_subdirectory(src/analyzer)
add_subdirectory(src/global)
add_subdirectory(src/utils)

add_llvm_executable(${PROJECT_NAME} ${SOURCES}
    "$<TARGET_OBJECTS:parser>"
    "$<TARGET_OBJECTS:generator>"
    "$<TARGET_OBJECTS:analyzer>"
    "$<TARGET_OBJECTS:global>"
    "$<TARGET_OBJECTS:utils>"
)

target_compile_options (${PROJECT_NAME} PUBLIC -fexceptions)

# windows package provides libclang.dll
set (CLANG_LIB clang)
if (WIN32)
    set (CLANG_LIB libclang)
endif()

# msvc build requires this components to be specified explicitly
llvm_map_components_to_libnames(llvm_libs support FrontendOpenMP)

target_link_libraries(${PROJECT_NAME} PRIVATE ${CLANG_LIB} clangAST clangBasic clangLex ${llvm_libs})

include(GNUInstallDirs) # provides CMAKE_INSTALL_* variables

set_target_properties(${PROJECT_NAME} PROPERTIES
    PUBLIC_HEADER "include/TS.h"
)

install(
    TARGETS ${PROJECT_NAME}
    EXPORT ${PROJECT_NAME}_export
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    PUBLIC_HEADER DESTINATION include
)
