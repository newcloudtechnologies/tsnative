#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
# 
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
# 
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

### Invokes declarator with given c++ source
### Args:
# NAME - target name
# SOURCE - given c++ source
# TARGET_COMPILER_ABI - target compiler abi (e.g. "x86_64-linux-gnu")
# IMPORT - extra import string:
#   (e.g. cmake: set(IMPORT "import { M1 } from \'path/to/M1\'; import { M2 } from \'path/to/M2\'"))
# TEMP_DIR - absolute path to temporary directory
# OUTPUT_DIR - absolute path to output directory
# INCLUDE_DIRECTORIES - list of include directories needed to execute declarator (absolute paths)
# [OUT] OUT_DECLARATION - generated file-declarations
function(ts_run_declarator NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "SOURCE;TARGET_COMPILER_ABI;IMPORT;TEMP_DIR;OUTPUT_DIR;OUT_DECLARATION"
        "INCLUDE_DIRECTORIES;"
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

    get_filename_component(source_fn "${ARG_SOURCE}" NAME)
    string(REPLACE ".h" ".d.ts" OUTPUT_FN "${source_fn}")

    set(INCLUDE_DIRECTORIES ${ARG_INCLUDE_DIRECTORIES})
    list(TRANSFORM INCLUDE_DIRECTORIES PREPEND "-I")
    string(REPLACE ";" " " INCLUDE_DIRECTORIES "${INCLUDE_DIRECTORIES}")

    set(OUTPUT_DIR "${ARG_OUTPUT_DIR}/declarations")
    set(OUTPUT_FILE "${OUTPUT_DIR}/${OUTPUT_FN}")

    if (NOT "$ENV{SYSROOT_DIR}" STREQUAL "")
        set(SYSROOT "--sysroot=$ENV{SYSROOT_DIR}")
        message(STATUS "SYSROOT=$ENV{SYSROOT_DIR}")
    endif()

    set(variables "DECLARATOR_OUTPUT_DIR=\"${OUTPUT_DIR}\" DECLARATOR_IMPORT=\"${ARG_IMPORT}\" DECLARATOR_TEMP_DIR=\"${ARG_TEMP_DIR}\"")
    set(command "${variables} ${TS_DECLARATOR} -x c++ --target=${ARG_TARGET_COMPILER_ABI} ${SYSROOT} -D TS ${ARG_SOURCE} ${INCLUDE_DIRECTORIES}")

    add_custom_command(
        OUTPUT ${OUTPUT_FILE}
        DEPENDS ${ARG_SOURCE}
        COMMAND echo "Run declarator..."
        COMMAND mkdir -p "${OUTPUT_DIR}"
        VERBATIM COMMAND sh -c "${command}"
    )

    # generate target: convert path of source file to dot-separated string
    get_filename_component(directory_fn "${ARG_SOURCE}" DIRECTORY)
    get_filename_component(source_fn "${ARG_SOURCE}" NAME)
    string(REPLACE "/" "." directory_fn "${directory_fn}")
    string(REPLACE "\\" "." directory_fn "${directory_fn}")
    string(REPLACE ".h" ".d.ts" source_fn "${source_fn}")
    set(TARGET "${directory_fn}.${source_fn}")

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
# TEMP_DIR - absolute path to temporary directory
# OUTPUT_DIR - absolute path to output directory
# INCLUDE_DIRECTORIES - list of include directories needed to execute declarator (absolute paths)
# SOURCES - list of c++ sources (i.e. headers) to generate declarations (with absolute paths)
# [OUT] OUT_DECLARATIONS - generated files-declarations
function(ts_generate_declarations NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "TARGET_COMPILER_ABI;IMPORT;TEMP_DIR;OUTPUT_DIR"
        "INCLUDE_DIRECTORIES;SOURCES;OUT_DECLARATIONS"
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
        ts_run_declarator(${NAME}
            SOURCE "${source}"
            INCLUDE_DIRECTORIES ${ARG_INCLUDE_DIRECTORIES}
            TARGET_COMPILER_ABI "${ARG_TARGET_COMPILER_ABI}"
            IMPORT "${ARG_IMPORT}"
            TEMP_DIR "${ARG_TEMP_DIR}"
            OUTPUT_DIR "${ARG_OUTPUT_DIR}"
            OUT_DECLARATION output
        )

        list(APPEND output_list "${output}")
    endforeach()

    set(${ARG_OUT_DECLARATIONS} ${output_list} PARENT_SCOPE)
endfunction()


#[[
function(generate_index dep_target exported_name declaration_list output_dir)
    set(target "${dep_target}_index_target")
    set(output_file "${output_dir}/index.ts")
    set(declarations )

    foreach(declaration_item ${declaration_list})
        get_filename_component(declaration "${declaration_item}" NAME)
        list(APPEND declarations "${declaration}")
    endforeach()

    # prepare content of file
    set(content_list )
    foreach(declaration ${declarations})
        set(s "/// <reference path='${declaration}' />")
        list(APPEND content_list "${s}")
    endforeach()

    list(APPEND content_list "export { ${exported_name} } from 'mgt';")

    # out to file semicolon separated list and then replace all semicolons to "\n"
    # and replace "'" to """
    add_custom_command(
        OUTPUT ${output_file}
        COMMAND echo "Generate index.ts ..."
        COMMAND mkdir -p "${output_dir}"
        VERBATIM COMMAND sh -c "echo \"${content_list}\" > \"${output_file}\""
        VERBATIM COMMAND sh -c "sed -i 's/;/\\n/g' ${output_file}"
        VERBATIM COMMAND sh -c "sed -i \"s/\'/\\\"/g\" ${output_file}"
    )

    add_custom_target(${target}
        DEPENDS ${output_file}
    )

    add_dependencies(${dep_target} ${target})
endfunction()

function(format_import module_path items out_list)
    set(result )

    foreach(item ${items})
        set(template "%1:%2")
        string(REPLACE "%1" "${item}" R1 ${template})
        string(REPLACE "%2" "${module_path}" R2 ${R1})
        list(APPEND result ${R2})
    endforeach()

    list(APPEND ${out_list} ${result})
    set(${out_list} ${${out_list}} PARENT_SCOPE)
endfunction()
]]

