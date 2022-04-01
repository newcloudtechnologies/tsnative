cmake_minimum_required(VERSION 3.16.3)
project(llvm_ir_eh_generator)

set(CMAKE_CXX_STANDARD 14)

if(${CMAKE_SYSTEM_NAME} STREQUAL "Darwin")
    find_package(LLVM "11.1.0" REQUIRED CONFIG)
else()
    find_package(LLVM "11.0.0" REQUIRED CONFIG)
endif()

message(STATUS "Found LLVM ${LLVM_PACKAGE_VERSION}")
message(STATUS "Using LLVMConfig.cmake in: ${LLVM_DIR}")
message(STATUS "LLVM_CMAKE_DIR=${LLVM_CMAKE_DIR}")
message(STATUS "LLVM_INCLUDE_DIRS=${LLVM_INCLUDE_DIRS}")
message(STATUS "LLVM_LIBRARY_DIRS=${LLVM_LIBRARY_DIRS}")

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${LLVM_CMAKE_DIR}")

include_directories(${CMAKE_JS_INC} "./node_modules/nan" ${LLVM_INCLUDE_DIRS})
add_definitions(${LLVM_DEFINITIONS} -DNOMINMAX)

file(GLOB SOURCE_FILES
        "src/*.h"
        "src/*.cc"
        "src/**/*.h"
        "src/**/*.cc"
        "node_modules/llvm-node/src/*.h"
        "node_modules/llvm-node/src/*.cc"
        "node_modules/llvm-node/src/**/*.h"
        "node_modules/llvm-node/src/**/*.cc"
        )

add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

llvm_map_components_to_libnames(llvm_libs ${LLVM_TARGETS_TO_BUILD} bitwriter codegen core support tablegen target)

target_link_libraries(${PROJECT_NAME} ${llvm_libs} ${CMAKE_JS_LIB} )
