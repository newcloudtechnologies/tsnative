#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

message(STATUS "Found TsDeclaratorUtils in ${CMAKE_CURRENT_LIST_DIR}")

define_property(TARGET PROPERTY TS_HEADERS
    BRIEF_DOCS "c++ headers to generate ts declarations"
    FULL_DOCS "c++ headers to generate ts declarations"
)

define_property(TARGET PROPERTY TS_INCLUDE_DIRECTORIES
    BRIEF_DOCS "list of include directories neened to declarator"
    FULL_DOCS "list of include directories neened to declarator"
)

define_property(TARGET PROPERTY TS_IMPORT
    BRIEF_DOCS "list of extra import signatures"
    FULL_DOCS "list of extra import signatures"
)

define_property(TARGET PROPERTY TS_NO_IMPORT_STD
    BRIEF_DOCS "Whether or not import std"
    FULL_DOCS "Whether or not import std [true/false]"
)

define_property(TARGET PROPERTY TS_EXPORTED_NAME
    BRIEF_DOCS "exported name from export signature"
    FULL_DOCS "e.g. export { ${ARG_EXPORTED_NAME} } from '${ARG_MODULE_NAME}'"
)

define_property(TARGET PROPERTY TS_MODULE_NAME
    BRIEF_DOCS "module name from export signature"
    FULL_DOCS "e.g. export { ${ARG_EXPORTED_NAME} } from '${ARG_MODULE_NAME}'"
)


### Recursively populates c++ include directories from target
### Args:
# TARGET - given target
# [OUT] INCLUDE_LIST - list of include directories
function(get_target_includes TARGET INCLUDE_LIST)
    set(result )

    get_target_property(includes ${TARGET} INTERFACE_INCLUDE_DIRECTORIES)
    list(FILTER includes EXCLUDE REGEX ".*[-]NOTFOUND")
    list(APPEND result ${includes})

    get_target_property(libraries ${TARGET} INTERFACE_LINK_LIBRARIES)

    foreach(item ${libraries})
        if (TARGET ${item})
            set(out_list )
            get_target_includes(${item} out_list)
            list(APPEND result ${out_list})
        endif()
    endforeach()

    list(REMOVE_DUPLICATES result)

    set(${INCLUDE_LIST} ${result} PARENT_SCOPE)
endfunction()


### Invokes declarator with given c++ source
### Args:
# NAME - target name
# SOURCE - given c++ source
# TARGET_COMPILER_ABI - target compiler abi (e.g. "x86_64-linux-gnu")
# IMPORT - extra import string:
#   (e.g. cmake: set(IMPORT "import { M1 } from \'path/to/M1\'; import { M2 } from \'path/to/M2\'"))
# NO_IMPORT_STD - declarator doesn't add standard imports by default [true/false]
# TEMP_DIR - absolute path to temporary directory
# OUTPUT_DIR - absolute path to output directory
# INCLUDE_DIRECTORIES - list of include directories needed to execute declarator (absolute paths)
# [OUT] OUT_DECLARATION - generated file-declarations
function(run_declarator NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "SOURCE;TARGET_COMPILER_ABI;IMPORT;NO_IMPORT_STD;TEMP_DIR;OUTPUT_DIR;OUT_DECLARATION"
        "DEFINITIONS;INCLUDE_DIRECTORIES;"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_SOURCE)
        message (FATAL_ERROR "SOURCE is not specified")
    endif ()

    if (NOT ARG_TARGET_COMPILER_ABI OR ARG_TARGET_COMPILER_ABI STREQUAL "")
        message (FATAL_ERROR "TARGET_COMPILER_ABI is not specified")
    endif ()

    if (NOT ARG_OUTPUT_DIR OR ARG_OUTPUT_DIR STREQUAL "")
        message (FATAL_ERROR "OUTPUT_DIR is not specified")
    endif ()

    if (NOT ARG_OUT_DECLARATION)
        message (FATAL_ERROR "OUT_DECLARATION is not specified")
    endif ()

    if (NOT ARG_INCLUDE_DIRECTORIES)
        message (FATAL_ERROR "INCLUDE_DIRECTORIES is not specified")
    endif ()

    if (NOT ARG_NO_IMPORT_STD)
        set(ARG_NO_IMPORT_STD "false")
    endif ()

    get_filename_component(source_fn "${ARG_SOURCE}" NAME)
    string(REPLACE ".h" ".d.ts" OUTPUT_FN "${source_fn}")

    set(INCLUDE_DIRECTORIES ${ARG_INCLUDE_DIRECTORIES})
    list(APPEND INCLUDE_DIRECTORIES "${tsnative-declarator_INCLUDE_DIRS}" "${tsnative-std_INCLUDE_DIRS}")

    # append builting include dirs
    list(APPEND INCLUDE_DIRECTORIES "${CMAKE_CXX_IMPLICIT_INCLUDE_DIRECTORIES}")

    # remove empty strings
    list(FILTER INCLUDE_DIRECTORIES EXCLUDE REGEX "^$")
    # <INSTALL_INTERFACE:...> strings will be evaluated into empty strings by cmake later so we need to filter them out too
    list(FILTER INCLUDE_DIRECTORIES EXCLUDE REGEX ".*[<]INSTALL_INTERFACE.*[>]$")
    list(TRANSFORM INCLUDE_DIRECTORIES PREPEND "-I")
    string(REPLACE ";" " " INCLUDE_DIRECTORIES "${INCLUDE_DIRECTORIES}")

    set(OUTPUT_DIR "${ARG_OUTPUT_DIR}")
    set(OUTPUT_FILE "${OUTPUT_DIR}/${OUTPUT_FN}")

    if (NOT "$ENV{SYSROOT_DIR}" STREQUAL "")
        set(SYSROOT "--sysroot=$ENV{SYSROOT_DIR}")
        message(STATUS "SYSROOT=$ENV{SYSROOT_DIR}")
    endif()

    set(DEFINITIONS )
    list(APPEND DEFINITIONS "-DTS")
    foreach(def ${ARG_DEFINITIONS})
        list(APPEND DEFINITIONS "-D${def}")
    endforeach()

    list(FILTER DEFINITIONS EXCLUDE REGEX "^$") # remove empty strings
    string(REPLACE ";" " " DEFINITIONS "${DEFINITIONS}")

    set(variables "DECLARATOR_OUTPUT_DIR=\"${OUTPUT_DIR}\" DECLARATOR_IMPORT=\"${ARG_IMPORT}\" DECLARATOR_NO_IMPORT_STD=\"${ARG_NO_IMPORT_STD}\"  DECLARATOR_TEMP_DIR=\"${ARG_TEMP_DIR}\"")
    set(command "${variables} ${TS_DECLARATOR} -nobuiltininc -x c++ --target=${ARG_TARGET_COMPILER_ABI} ${SYSROOT} ${DEFINITIONS} ${ARG_SOURCE} ${INCLUDE_DIRECTORIES}")

    add_custom_command(
        OUTPUT ${OUTPUT_FILE}
        DEPENDS ${ARG_SOURCE}
        COMMAND echo "Run declarator..."
        COMMAND sh -c "mkdir -p ${OUTPUT_DIR}"
        VERBATIM COMMAND sh -c "${command}"
    )

    # generate target
    string(MD5 TARGET "${OUTPUT_FILE}")

    add_custom_target(${TARGET}
        DEPENDS ${OUTPUT_FILE}
    )

    add_dependencies(${NAME} ${TARGET})
    set(${ARG_OUT_DECLARATION} ${OUTPUT_FILE} PARENT_SCOPE)
endfunction()


### Generate TS declarations for given c++ sources
### Args:
# NAME - target name
# TARGET_COMPILER_ABI - target compiler abi (e.g. "x86_64-linux-gnu")
# IMPORT - extra import string:
#   (e.g. cmake: set(IMPORT "import { M1 } from \'path/to/M1\'; import { M2 } from \'path/to/M2\'"))
# NO_IMPORT_STD - declarator doesn't add standard imports by default [true/false]
# TEMP_DIR - absolute path to temporary directory
# OUTPUT_DIR - absolute path to output directory
# INCLUDE_DIRECTORIES - list of include directories needed to execute declarator (absolute paths)
# SOURCES - list of c++ sources (i.e. headers) to generate declarations (with absolute paths)
# [OUT] OUT_DECLARATIONS - generated files-declarations
function(generate_declarations_ex NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "TARGET_COMPILER_ABI;IMPORT;NO_IMPORT_STD;TEMP_DIR;OUTPUT_DIR"
        "DEFINITIONS;SOURCES;INCLUDE_DIRECTORIES;OUT_DECLARATIONS"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_TARGET_COMPILER_ABI OR ARG_TARGET_COMPILER_ABI STREQUAL "")
        message (FATAL_ERROR "TARGET_COMPILER_ABI is not specified")
    endif ()

    if (NOT ARG_OUTPUT_DIR OR ARG_OUTPUT_DIR STREQUAL "")
        message (FATAL_ERROR "OUTPUT_DIR is not specified")
    endif ()

    if (NOT ARG_INCLUDE_DIRECTORIES)
        message (FATAL_ERROR "INCLUDE_DIRECTORIES is not specified")
    endif ()

    if (NOT ARG_SOURCES)
        message (FATAL_ERROR "SOURCES is not specified")
    endif ()

    if (NOT ARG_OUT_DECLARATIONS)
        message (FATAL_ERROR "OUT_DECLARATIONS is not specified")
    endif ()

    set (output_list )
    foreach(source ${ARG_SOURCES})

        set (output )
        run_declarator(${NAME}
            SOURCE "${source}"
            DEFINITIONS ${ARG_DEFINITIONS}
            INCLUDE_DIRECTORIES ${ARG_INCLUDE_DIRECTORIES}
            TARGET_COMPILER_ABI "${ARG_TARGET_COMPILER_ABI}"
            IMPORT "${ARG_IMPORT}"
            NO_IMPORT_STD "${ARG_NO_IMPORT_STD}"
            TEMP_DIR "${ARG_TEMP_DIR}"
            OUTPUT_DIR "${ARG_OUTPUT_DIR}"
            OUT_DECLARATION output
        )

        list(APPEND output_list "${output}")
    endforeach()

    set(${ARG_OUT_DECLARATIONS} ${output_list} PARENT_SCOPE)
endfunction()


### Generate TS declarations for given c++ sources
### Loads SOURCES, INCLUDE_DIRECTORIES, IMPORT from target's properties
### Args:
# NAME - target name
# TARGET_COMPILER_ABI - target compiler abi (e.g. "x86_64-linux-gnu")
# OUTPUT_DIR - absolute path to output directory
# [OUT] OUT_DECLARATIONS - generated files-declarations
function(ts_generate_declarations NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "TARGET_COMPILER_ABI;OUTPUT_DIR"
        "DEFINITIONS;OUT_DECLARATIONS"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_TARGET_COMPILER_ABI OR ARG_TARGET_COMPILER_ABI STREQUAL "")
        message (FATAL_ERROR "TARGET_COMPILER_ABI is not specified")
    endif ()

    if (NOT ARG_OUTPUT_DIR OR ARG_OUTPUT_DIR STREQUAL "")
        message (FATAL_ERROR "OUTPUT_DIR is not specified")
    endif ()

    if (NOT ARG_OUT_DECLARATIONS)
        message (FATAL_ERROR "OUT_DECLARATIONS is not specified")
    endif ()

    get_target_property(SOURCES ${NAME} TS_HEADERS)
    get_target_property(INCLUDE_DIRECTORIES ${NAME} TS_INCLUDE_DIRECTORIES)
    get_target_property(IMPORT ${NAME} TS_IMPORT)
    get_target_property(NO_IMPORT_STD ${NAME} TS_NO_IMPORT_STD)

    set(DECLARATIONS )
    generate_declarations_ex(${NAME}
        SOURCES ${SOURCES}
        TARGET_COMPILER_ABI "${ARG_TARGET_COMPILER_ABI}"
        IMPORT "${IMPORT}"
        NO_IMPORT_STD "${NO_IMPORT_STD}"
        DEFINITIONS ${ARG_DEFINITIONS}
        INCLUDE_DIRECTORIES "${INCLUDE_DIRECTORIES}"
        OUTPUT_DIR "${ARG_OUTPUT_DIR}"
        TEMP_DIR "${ARG_OUTPUT_DIR}/temp"
        OUT_DECLARATIONS DECLARATIONS
    )

    set(${ARG_OUT_DECLARATIONS} ${DECLARATIONS} PARENT_SCOPE)
endfunction()


### Generate TS module index
### Args:
# NAME - target name
# EXPORTED_NAME - exported name from export signature
# MODULE_NAME - module name from export signature
#   (e.g. export { ${ARG_EXPORTED_NAME} } from '${ARG_MODULE_NAME}')
# DECLARATIONS - list of declaration files
# OUT_DIRECTORY - directory with generated index.ts file
function(ts_generate_index_ex NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "EXPORTED_NAME;MODULE_NAME;OUT_DIRECTORY;"
        "DECLARATIONS;"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_EXPORTED_NAME OR ARG_EXPORTED_NAME STREQUAL "")
        message (FATAL_ERROR "EXPORTED_NAME is not specified")
    endif ()

    if (NOT ARG_MODULE_NAME OR ARG_MODULE_NAME STREQUAL "")
        message (FATAL_ERROR "MODULE_NAME is not specified")
    endif ()

    if (NOT ARG_OUT_DIRECTORY)
        message (FATAL_ERROR "OUT_DIRECTORY is not specified")
    endif ()

    if (NOT ARG_DECLARATIONS)
        message (FATAL_ERROR "DECLARATIONS is not specified")
    endif ()

    set(output_file "${ARG_OUT_DIRECTORY}/index.ts")

    # generate filenames of declarations without full paths
    set(declarations )
    foreach(declaration_item ${ARG_DECLARATIONS})
        get_filename_component(declaration "${declaration_item}" NAME)
        list(APPEND declarations "${declaration}")
    endforeach()

    # prepare content of file
    set(content_list )
    foreach(declaration ${declarations})
        set(s "/// <reference path='${declaration}' />")
        list(APPEND content_list "${s}")
    endforeach()

    list(APPEND content_list "export { ${ARG_EXPORTED_NAME} } from '${ARG_MODULE_NAME}';")

    # out to file semicolon separated list and then replace all semicolons to "\n"
    # and replace "'" to """
    add_custom_command(
        OUTPUT ${output_file}
        COMMAND echo "Generate index.ts ..."
        COMMAND mkdir -p "${ARG_OUT_DIRECTORY}"
        VERBATIM COMMAND sh -c "echo \"${content_list}\" >> \"${output_file}\""
        VERBATIM COMMAND sh -c "sed -i 's/;/\\n/g' ${output_file}"
        VERBATIM COMMAND sh -c "sed -i \"s/\'/\\\"/g\" ${output_file}"
    )

    string(MD5 TARGET "${output_file}")

    add_custom_target(${TARGET}
        DEPENDS ${output_file}
    )

    add_dependencies(${NAME} ${TARGET})
endfunction()


### Generate TS module index
### Loads EXPORTED_NAME, MODULE_NAME from target's property
### Args:
# NAME - target name
# DECLARATIONS - list of declaration files
# OUT_DIRECTORY - directory with generated index.ts file
function(ts_generate_index NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "OUT_DIRECTORY;"
        "DECLARATIONS;"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_OUT_DIRECTORY)
        message (FATAL_ERROR "OUT_DIRECTORY is not specified")
    endif ()

    if (NOT ARG_DECLARATIONS)
        message (FATAL_ERROR "DECLARATIONS is not specified")
    endif ()

    get_target_property(EXPORTED_NAME ${NAME} TS_EXPORTED_NAME)
    get_target_property(MODULE_NAME ${NAME} TS_MODULE_NAME)

    ts_generate_index_ex(${NAME}
        DECLARATIONS ${ARG_DECLARATIONS}
        OUT_DIRECTORY ${ARG_OUT_DIRECTORY}
        EXPORTED_NAME ${EXPORTED_NAME}
        MODULE_NAME ${MODULE_NAME}
    )
endfunction()


### Build TS Extension library
### Args:
# NAME - target name
# TS_IMPORT - import signature
# TS_NO_IMPORT_STD - whether or not import std [true/false]
# TS_EXPORTED_NAME - exported name from export signature
# TS_MODULE_NAME - module name from export signature
# SOURCES - source files to compile
# LINK_LIBRARIES - absolute paths to any libraries to be link extension
# LIBRARY_DEPENDENCIES - additional libraries to be link into final executable
# INCLUDE_DIRECTORIES - paths to search for extension headers
# DEFINITIONS - compile definitions
# TS_HEADERS - list of header files to generate declarations
function (ts_build_extension NAME ...)
# TODO: static/shared switch?
    cmake_parse_arguments (PARSE_ARGV 1
        "ARG"
        ""
        "TS_IMPORT;TS_NO_IMPORT_STD;TS_EXPORTED_NAME;TS_MODULE_NAME;TS_DECLARATIONS_OUT_DIR"
        "SOURCES;INCLUDE_DIRECTORIES;LINK_LIBRARIES;DEFINITIONS;LIBRARY_DEPENDENCIES;TS_HEADERS"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${arg_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_SOURCES OR ARG_SOURCES STREQUAL "")
        message (FATAL_ERROR "No SOURCES provided for extension library")
    endif ()

    if (NOT ARG_TS_DECLARATIONS_OUT_DIR OR ARG_TS_DECLARATIONS_OUT_DIR STREQUAL "")
        set(ARG_TS_DECLARATIONS_OUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/declarations")
    endif ()

    add_library(${NAME} ${ARG_SOURCES})

    target_link_libraries(${NAME}
        PUBLIC
            ${ARG_LINK_LIBRARIES}
    )

    set(INCLUDE_DIRECTORIES )
    get_target_includes(${NAME} INCLUDE_DIRECTORIES)
    list(APPEND INCLUDE_DIRECTORIES ${ARG_INCLUDE_DIRECTORIES})

    target_include_directories(${NAME}
        PUBLIC
            ${INCLUDE_DIRECTORIES}
    )

    set_target_properties(${NAME} PROPERTIES
        OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/${CMAKE_STATIC_LIBRARY_PREFIX}${NAME}${CMAKE_STATIC_LIBRARY_SUFFIX}"
        INCLUDE_PATHS "${ARG_INCLUDE_DIRECTORIES}"
        LIBRARY_DEPENDENCIES "${ARG_LIBRARY_DEPENDENCIES}"
        DEFINITIONS "${ARG_DEFINITIONS}"
        TS_HEADERS "${ARG_TS_HEADERS}"
        TS_INCLUDE_DIRECTORIES "${INCLUDE_DIRECTORIES}"
        TS_IMPORT "${ARG_TS_IMPORT}"
        TS_NO_IMPORT_STD "${ARG_TS_NO_IMPORT_STD}"
        TS_EXPORTED_NAME "${ARG_TS_EXPORTED_NAME}"
        TS_MODULE_NAME "${ARG_TS_MODULE_NAME}"
        TS_DECLARATIONS_OUT_DIR "${ARG_TS_DECLARATIONS_OUT_DIR}"
    )

endfunction()
