cmake_minimum_required(VERSION 3.10)
project(tsnative-std LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(GENERATE_DECLARATIONS "Allows generating TypeScript declarations" ON)    #  OFF

get_filename_component(INSTALL_DIR "${CMAKE_CURRENT_LIST_DIR}/../out/install" REALPATH)
list(APPEND CMAKE_MODULE_PATH "${INSTALL_DIR}/cmake")

# temporary hack: allows us to build std using abseil deployed to install dir
list(APPEND CMAKE_PREFIX_PATH ${CMAKE_INSTALL_PREFIX}/cmake)
find_package(absl)

find_package(TsDeclarator REQUIRED)

include(TsDeclaratorUtils)

set(TS_HEADERS
    include/std/console.h
    include/std/iterable.h
    include/std/tsarray.h
    include/std/tsboolean.h
    include/std/tsmap.h
    include/std/tsnumber.h
    include/std/tsset.h
    include/std/tsstring.h
    include/std/tstuple.h
    include/std/iterators/mapiterator.h
    include/std/iterators/setiterator.h
    include/std/iterators/stringiterator.h
)

set(HEADERS
    ${TS_HEADERS}
    include/std/gc.h
    include/std/tsclosure.h
    include/std/tsoptional.h
)

set(SOURCES
    src/gc.cpp
    src/tsstring.cpp
    src/tsclosure.cpp
    src/tsnumber.cpp
    src/tsboolean.cpp
    src/private/tsboolean_cxx_builtin_p.cpp
    src/private/tsnumber_cxx_builtin_p.cpp
    src/private/tsstring_std_p.cpp
)

### Generate TS declarations for given c++ sources
### Args:
# NAME - target name
# 
# 
# 
# 
# 
function(target_ts_properties NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "IMPORT"
        "SOURCES;INCLUDE_DIRECTORIES"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()
#[[
    if (NOT ARG_IMPORT)
        message (FATAL_ERROR "IMPORT is not specified")
    endif ()
]]
    if (NOT ARG_SOURCES)
        message (FATAL_ERROR "SOURCES is not specified")
    endif ()

    if (NOT ARG_INCLUDE_DIRECTORIES)
        message (FATAL_ERROR "INCLUDE_DIRECTORIES is not specified")
    endif ()

    set (TS_SOURCES ${ARG_SOURCES})
#    list(TRANSFORM TS_SOURCES PREPEND "${CMAKE_CURRENT_SOURCE_DIR}/")

    set_target_properties(${PROJECT_NAME} PROPERTIES
        TS_SOURCES "${TS_SOURCES}"
        TS_INCLUDE_DIRECTORIES "${ARG_INCLUDE_DIRECTORIES}"
        TS_IMPORT "${ARG_IMPORT}"
    )

endfunction()

add_library(${PROJECT_NAME}
    ${HEADERS} ${SOURCES} 
)

target_compile_definitions(${PROJECT_NAME}
    PUBLIC
        USE_STD_ARRAY_BACKEND
        USE_MAP_STD_BACKEND
        USE_SET_STD_BACKEND
        USE_TUPLE_STD_BACKEND
        USE_BOOLEAN_CXX_BUILTIN_BACKEND
        USE_NUMBER_CXX_BUILTIN_BACKEND
        USE_STD_STRING_BACKEND
)

target_include_directories(${PROJECT_NAME}
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
        ${CMAKE_CURRENT_SOURCE_DIR}/../declarator/include
        "$<INSTALL_INTERFACE:$<INSTALL_PREFIX>/abseil/include>"
    PUBLIC
        "$<INSTALL_INTERFACE:$<INSTALL_PREFIX>/${CMAKE_INSTALL_INCLUDEDIR}>"
    )

target_link_libraries(${PROJECT_NAME}
    PUBLIC 
        $<BUILD_INTERFACE:absl::time>
)

if (GENERATE_DECLARATIONS)
    set(IMPORT "")
    list(TRANSFORM TS_HEADERS PREPEND "${PROJECT_SOURCE_DIR}/")
    set(include_directories 
        "${CMAKE_CURRENT_LIST_DIR}/include"
        "${INSTALL_DIR}/include"
    )

    target_ts_properties(${PROJECT_NAME} 
        SOURCES ${TS_HEADERS}
        INCLUDE_DIRECTORIES ${include_directories}
        IMPORT "${IMPORT}"
    )

    set(declaration_list )

    ts_generate_declarations(${PROJECT_NAME}
        TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
        OUTPUT_DIR "${CMAKE_CURRENT_BINARY_DIR}"
        OUT_DECLARATIONS declaration_list
    )

#[[
    generate_declarations(${PROJECT_NAME}
        SOURCES ${TS_HEADERS}
        TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
        IMPORT "${IMPORT}"
        INCLUDE_DIRECTORIES "${include_directories}"
        OUTPUT_DIR "${CMAKE_CURRENT_BINARY_DIR}"
        TEMP_DIR "${CMAKE_CURRENT_BINARY_DIR}/temp"
        OUT_DECLARATIONS declaration_list
    )
]]

#    message(STATUS "declaration_list=${declaration_list}")

#    ts_generate_declarations(${PROJECT_NAME})
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
    DIRECTORY   decorators definitions
    DESTINATION "std"
)

# FIXME: a special hack to conform current compiler's hardcoded structure
install(
    DIRECTORY   definitions
    DESTINATION "${CMAKE_CURRENT_BINARY_DIR}" 
)
