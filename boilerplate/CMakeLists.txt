cmake_minimum_required(VERSION 3.13)

include(cmake/init_conan.cmake)

project(awesome LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(cmake/init_cmake.cmake)

add_subdirectory(ts)
add_subdirectory(cxx)

get_extensions_list(TSNATIVE_CXX_EXTENSION_LIBRARIES)

copy_tsnative_std_to_node_modules(TSNATIVE_STD_DECLARATIONS)

add_ts_library(
    ${TSNATIVE_OUTPUT_LIBRARY_NAME}
  SRC
    ${TS_MAIN}
  TS_CONFIG
    ${TS_CONFIG}
  LIBRARIES
    ${TSNATIVE_CXX_EXTENSION_LIBRARIES}
  DEPENDS
    ${TSNATIVE_STD_DECLARATIONS}
  PRINT_IR
    ${PRINT_IR}
  TRACE_IMPORT
    ${TRACE_IMPORT}
  OPT_LEVEL
    ${OPT_LEVEL}
  ENABLE_OPTIMIZATIONS
    ${ENABLE_OPTIMIZATIONS}
)

add_executable(${PROJECT_NAME} WIN32 ${TS_MAIN})
target_link_libraries(${PROJECT_NAME} PRIVATE ${TSNATIVE_OUTPUT_LIBS} ${TSNATIVE_CXX_EXTENSION_LIBRARIES})
