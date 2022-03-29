cmake_minimum_required(VERSION 3.10)
project(tsnative-std)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# temporary hack: allows us to build std using abseil deployed to install dir
list(APPEND CMAKE_PREFIX_PATH ${CMAKE_INSTALL_PREFIX}/cmake)
find_package(absl)

set(SOURCES
    src/gc.cpp
    src/tsstring.cpp
    src/tsclosure.cpp
    src/tsnumber.cpp
    src/tsboolean.cpp
    src/tsundefined.cpp
    src/tsnull.cpp
    src/tsobject.cpp
    src/tsunion.cpp

    src/private/tsboolean_cxx_builtin_p.cpp
    src/private/tsnumber_cxx_builtin_p.cpp
    src/private/tsstring_std_p.cpp
)

add_library(${PROJECT_NAME}
    ${SOURCES} ${HEADERS}
)

target_include_directories(${PROJECT_NAME}
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
    PUBLIC
        "$<INSTALL_INTERFACE:$<INSTALL_PREFIX>/${CMAKE_INSTALL_INCLUDEDIR}>"
    )

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
    DIRECTORY   decorators definitions
    DESTINATION "std"
)

# FIXME: a special hack to conform current compiler's hardcoded structure
install(
    DIRECTORY   definitions
    DESTINATION "${CMAKE_CURRENT_BINARY_DIR}" 
)
