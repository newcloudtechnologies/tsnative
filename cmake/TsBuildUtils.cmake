#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

if (NOT __ts_build_utils_cmake_guard)
set (__ts_build_utils_cmake_guard 1)

# TODO: fill the info
# Required non-empty variables:
# * PROJECT_ROOT
# * PROJECT_BUILD_DIR
# * PROJECT_OUTPUT_BINARY
# * PROJECT_ENTRY_NAME

message(STATUS "Found TsBuildUtils in ${CMAKE_CURRENT_LIST_DIR}")

function(makeOutputDir target dep_target entry output_dir)
    getBinaryName(${entry} binary_name)

    if("${PROJECT_BUILD_DIR}" STREQUAL "")
        set(dir "${CMAKE_CURRENT_BINARY_DIR}/${binary_name}.dir")
    else()
        set(dir "${PROJECT_BUILD_DIR}/${binary_name}.dir")
    endif()

    add_custom_command(
        OUTPUT ${dir}
        DEPENDS ${entry}
        COMMAND echo "Creating output dir..."
        COMMAND mkdir -p "${dir}"
    )

    add_custom_target(${target}
        DEPENDS ${dir}
    )

    add_dependencies(${target} ${dep_target})

    set(${output_dir} ${dir} PARENT_SCOPE)
endfunction()

function(getBinaryName entry binaryName)
    get_filename_component(entry_fn "${PROJECT_OUTPUT_BINARY}" NAME)
    set(binary_name ${entry_fn})

    set(${binaryName} ${binary_name} PARENT_SCOPE)
endfunction()

function(getBinaryPath binaryPath)
    get_filename_component(source_path "${PROJECT_OUTPUT_BINARY}" DIRECTORY)
    set(binary_path ${source_path})

    set(${binaryPath} ${binary_path} PARENT_SCOPE)
endfunction()

function(getProjectPath entry projectPath)
    set(found_file )
    set(current_path )
    set(project_path )

    get_filename_component(current_path "${entry}" DIRECTORY)

    while("${found_file}" STREQUAL "")
        file(GLOB found_file ${current_path}/package.json)

        if(NOT "${found_file}" STREQUAL "")
            set(project_path ${current_path})
            break()
        else()
            get_filename_component(parent_path "${current_path}/.." ABSOLUTE)

            if("${parent_path}" STREQUAL "/")
                break()
            endif()

            set(current_path ${parent_path})
        endif()
    endwhile()

    set(${projectPath} ${project_path} PARENT_SCOPE)
endfunction()

function(getProjectFiles entry projectFiles)
    getProjectPath("${entry}" projectPath)

    get_filename_component(entry_fn ${entry} NAME)

    file(GLOB_RECURSE project_files ${projectPath}/*.ts)

    # filter node_modules
    list(FILTER project_files EXCLUDE REGEX ".*/node_modules/.*")

    # filter entry
    list(FILTER project_files EXCLUDE REGEX ".*/${entry_fn}")

    set(${projectFiles} ${project_files} PARENT_SCOPE)
endfunction()

function(extractSymbols target dep_target dependencies output_dir demangledList mangledList)
    set(output_demangledList )
    set(output_mangledList )

    foreach(dep_full_fn ${dependencies})
        get_filename_component(dep_fn "${dep_full_fn}" NAME)

        set(demangled_nm_fn "${output_dir}/${dep_fn}.dm.nm")
        set(mangled_nm_fn "${output_dir}/${dep_fn}.m.nm")

        list(APPEND output_demangledList ${demangled_nm_fn})
        list(APPEND output_mangledList ${mangled_nm_fn})

        add_custom_command(
            OUTPUT ${demangled_nm_fn}
            COMMAND ${CMAKE_NM} -C ${dep_full_fn} > ${demangled_nm_fn}
            DEPENDS ${dep_full_fn}
        )

        add_custom_command(
            OUTPUT ${mangled_nm_fn}
            COMMAND ${CMAKE_NM} ${dep_full_fn} > ${mangled_nm_fn}
            DEPENDS ${dep_full_fn}
        )
    endforeach()

    add_custom_target(${target}
        DEPENDS ${output_demangledList} ${output_mangledList}
    )

    add_dependencies(${target} ${dep_target})

    set(${demangledList} ${output_demangledList} PARENT_SCOPE)
    set(${mangledList} ${output_mangledList} PARENT_SCOPE)
endfunction()

function(generateSeed target dep_target output_dir seed_src)
    set(output "${output_dir}/seed.cpp")

    add_custom_command(
        OUTPUT ${output}
        COMMAND echo "Generating seed..."
        COMMAND echo "int seed(){return 0;}" > ${output} VERBATIM
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})

    set(${seed_src} ${output} PARENT_SCOPE)
endfunction()

function(instantiate_classes target dep_target entry sources includes output_dir classes_src)
    set(output
        "${output_dir}/instantiated_classes.cpp")

    string(REPLACE ";" ", " INCLUDES "${includes}")

    set(INCLUDE_DIRS )
    if (INCLUDES)
        set(INCLUDE_DIRS --includeDirs ${INCLUDES})
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${entry} ${sources}
        WORKING_DIRECTORY ${PROJECT_ROOT}
        COMMAND echo "Instantiating classes..."
        COMMAND ${TS_COMPILER}
        ARGS ${entry}   --tsconfig ${TS_CONFIG}
                        --baseUrl ${PROJECT_BASE_URL}
                        --processTemplateClasses
                        ${INCLUDE_DIRS}
                        --templatesOutputDir ${output_dir}
                        --build ${output_dir}
    )

    add_custom_target(${target}
        DEPENDS ${output})

    add_dependencies(${target} ${dep_target})

    set(${classes_src} ${output} PARENT_SCOPE)
endfunction()

function(instantiate_functions target dep_target entry sources includes output_dir demangledList mangledList functions_src)
    set(output
        "${output_dir}/instantiated_functions.cpp")

    string(REPLACE ";" ", " DEMANGLED "${demangledList}")
    string(REPLACE ";" ", " MANGLED "${mangledList}")
    string(REPLACE ";" ", " INCLUDES "${includes}")

    set(INCLUDE_DIRS )
    if (INCLUDES)
        set(INCLUDE_DIRS --includeDirs ${INCLUDES})
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${entry} ${sources}
        WORKING_DIRECTORY ${PROJECT_ROOT}
        COMMAND echo "Instantiating functions..."
        COMMAND ${TS_COMPILER}
        ARGS ${entry}   --tsconfig ${TS_CONFIG}
                        --baseUrl ${PROJECT_BASE_URL}
                        --processTemplateFunctions ${INCLUDE_DIRS}
                        --demangledTables ${DEMANGLED}
                        --mangledTables ${MANGLED}
                        --templatesOutputDir ${output_dir}
                        --build ${output_dir}
    )

    add_custom_target(${target}
        DEPENDS ${output})

    add_dependencies(${target} ${dep_target})

    set(${functions_src} ${output} PARENT_SCOPE)
endfunction()

function(compile_cpp target dep_target includes definitions entry output_dir compiled)
    string(REPLACE ".cpp" ".o" output "${entry}")

    list(TRANSFORM includes PREPEND "-I")

    set(ISYSROOT )
    if(APPLE)
        set(ISYSROOT_ARG "-isysroot ${CMAKE_OSX_SYSROOT}")
        separate_arguments(ISYSROOT NATIVE_COMMAND ${ISYSROOT_ARG})
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${entry}
        WORKING_DIRECTORY ${output_dir}
        COMMAND echo "Compiling cpp..."
        COMMAND ${CMAKE_CXX_COMPILER}
        ARGS ${ISYSROOT} -std=c++${CMAKE_CXX_STANDARD} -c ${includes} ${definitions} ${entry}
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})

    set(${compiled} ${output} PARENT_SCOPE)
endfunction()


function(verify_ts target dep_target entry sources output_dir)
    get_filename_component(entry_fn "${entry}" NAME)

    string(REPLACE ".ts" ".js" OUTPUT_FN "${entry_fn}")
    set(output "${output_dir}/${OUTPUT_FN}")

    # TODO: make verifies args configurable for clients
    # at least --traceResolution
    add_custom_command(
        OUTPUT ${output}
        DEPENDS "${entry}" "${sources}"
        WORKING_DIRECTORY ${PROJECT_ROOT}
        COMMAND echo "Running TS verifier: ${entry}"
        COMMAND ${TS_VERIFIER}
        ARGS ${entry} --alwaysStrict 
                      --target es6 
                      --experimentalDecorators
                      --moduleResolution node
                      --baseUrl ${PROJECT_BASE_URL}
                      --outDir ${output_dir}
                    #   --traceResolution
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})
endfunction()

function(compile_ts target dep_target entry sources demangledList mangledList output_dir is_printIr ll_bytecode)
    get_filename_component(entry_fn "${entry}" NAME)

    string(REPLACE ".ts" ".ll" OUTPUT_FN "${entry_fn}")
    string(REPLACE ";" ", " DEMANGLED "${demangledList}")
    string(REPLACE ";" ", " MANGLED "${mangledList}")

    set(output "${output_dir}/${OUTPUT_FN}")

    set(PRINT_IR )
    if (is_printIr)
        set(PRINT_IR --printIR)
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS "${entry}" "${sources}" "${demangledList}" "${mangledList}"
        WORKING_DIRECTORY ${PROJECT_ROOT}
        COMMAND echo "Running TS compiler: ${entry}"
        COMMAND ${TS_COMPILER}
        ARGS ${entry} --tsconfig ${TS_CONFIG} ${PRINT_IR}
                      --baseUrl ${PROJECT_BASE_URL}
                      --demangledTables ${DEMANGLED}
                      --mangledTables ${MANGLED}
                      --build ${output_dir}
                      --emitIR
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})

    set(${ll_bytecode} ${output} PARENT_SCOPE)
endfunction()

function(compile_ll target dep_target ll_bytecode optimizationLevel output_dir compiled_source)
    find_package(LLVM REQUIRED CONFIG)
    string(REPLACE ".ll" ".o" output "${ll_bytecode}")

    # TODO: make compile options configurable
    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${ll_bytecode}
        COMMAND echo "Running llc..."
        COMMAND ${LLVM_TOOLS_BINARY_DIR}/llc${CMAKE_EXECUTABLE_SUFFIX} ${optimizationLevel} -relocation-model=pic -filetype=obj ${ll_bytecode} -o ${output}
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})

    set(${compiled_source} ${output} PARENT_SCOPE)
endfunction()

function(link target dep_target seed_src compiled_source dependencies)
    getBinaryPath(binaryPath)
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${binaryPath}")

    add_executable(${${target}} WIN32 ${seed_src})

    target_link_libraries(${${target}}
        PRIVATE
            ${compiled_source}
            ${dependencies}
    )

    if (NOT "${TS_EXTENSION_TARGET}" STREQUAL "fake")
        target_link_libraries(${${target}} PRIVATE ${TS_EXTENSION_TARGET})
    endif()


    add_dependencies(${${target}} ${dep_target})
endfunction()

function(build target dep_target entry includes dependencies definitions optimization_level is_test is_printIr)
    # Collect all project's *.ts source files to enable incremental build
    getProjectFiles("${entry}" sources)

    getBinaryName("${entry}" binary_name)

    makeOutputDir(makeOutputDir_${binary_name} ${dep_target} "${entry}" output_dir)

    verify_ts(verify_ts_${binary_name} makeOutputDir_${binary_name} "${entry}" "${sources}" "${output_dir}")

    instantiate_classes(instantiate_classes_${binary_name} verify_ts_${binary_name} "${entry}" "${sources}" "${includes}" "${output_dir}" CLASSES_SRC)

    compile_cpp(compile_classes_${binary_name} instantiate_classes_${binary_name} "${includes}" "${definitions}" "${CLASSES_SRC}" "${output_dir}" COMPILED_CLASSES)

    extractSymbols(extract_classes_symbols_${binary_name} compile_classes_${binary_name} "${COMPILED_CLASSES}" "${output_dir}" COMPILED_CLASSES_DEMANGLED_NAMES COMPILED_CLASSES_MANGLED_NAMES)

    instantiate_functions(instantiate_functions_${binary_name} extract_classes_symbols_${binary_name} "${entry}" "${sources}" "${includes}" "${output_dir}" "${COMPILED_CLASSES_DEMANGLED_NAMES}" ${COMPILED_CLASSES_MANGLED_NAMES} FUNCTIONS_SRC)

    compile_cpp(compile_functions_${binary_name} instantiate_functions_${binary_name} "${includes}" "${definitions}" "${FUNCTIONS_SRC}" "${output_dir}" COMPILED_FUNCTIONS)

    list(PREPEND DEPENDENCIES ${COMPILED_CLASSES} ${COMPILED_FUNCTIONS})

    extractSymbols(extract_symbols_${binary_name} compile_functions_${binary_name} "${DEPENDENCIES}" "${output_dir}" DEMANGLED_NAMES MANGLED_NAMES)

    compile_ts(compile_ts_${binary_name} extract_symbols_${binary_name} "${entry}" "${sources}" "${DEMANGLED_NAMES}" "${MANGLED_NAMES}" "${output_dir}" "${is_printIr}" LL_BYTECODE)

    compile_ll(compile_ll_${binary_name} compile_ts_${binary_name} "${LL_BYTECODE}" "${optimization_level}" "${output_dir}" COMPILED_SOURCE)

    generateSeed(generate_seed_${binary_name} compile_ll_${binary_name} "${output_dir}" SEED_SRC)

    link(binary_name generate_seed_${binary_name} "${SEED_SRC}" "${COMPILED_SOURCE}" "${DEPENDENCIES}")

    if(is_test)
        add_test(
            NAME ${binary_name} 
            COMMAND ${binary_name}
            WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/..)
    endif()

    set(${target} ${binary_name} PARENT_SCOPE)
endfunction()

### Build TS Extension library
### Args:
# Extension target name
# SOURCES - source files to compile
# INCLUDE_PATHS - paths to search for extension headers
# LIBRARY_DEPENDENCIES - absolute paths to any external binary dependency that supposed to be link into final executable

function (ts_build_extension NAME ...)
# TODO: static/shared switch?
    cmake_parse_arguments (PARSE_ARGV 1 
        "ARG" # prefix for output vars containing arg values
        "" # options
        "" # one-value args
        "SOURCES;INCLUDE_PATHS;LIBRARY_DEPENDENCIES" # multi-value args
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${arg_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_SOURCES OR ARG_SOURCES STREQUAL "")
        message (FATAL_ERROR "No SOURCES provided for extension library")
    endif ()

    if (NOT ARG_INCLUDE_PATHS OR ARG_INCLUDE_PATHS STREQUAL "")
        message (FATAL_ERROR "No INCLUDE_PATHS provided for extension library")
    endif ()

    add_library(${NAME} ${ARG_SOURCES})

    target_include_directories(${NAME} PUBLIC ${StdLib_INCLUDE_DIR})

    set_target_properties(${NAME} PROPERTIES
        # TODO: can we extract lib name from cmake's internal props or generator expressions like $<TARGET_FILE:${NAME}> 
        OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/${CMAKE_STATIC_LIBRARY_PREFIX}${NAME}${CMAKE_STATIC_LIBRARY_SUFFIX}"
        INCLUDES "${ARG_INCLUDE_PATHS}"
        LIBRARY_DEPENDENCIES "${ARG_LIBRARY_DEPENDENCIES}"
    )
    
    # TODO: hack. DEFINITIONS has to be set in ts_generate_declarations
    set_target_properties(${NAME} PROPERTIES DEFINITIONS "")
    
    set(TS_EXTENSION_TARGET ${NAME} PARENT_SCOPE)

endfunction()

# TODO: implement this helper fuction

### Generate TS declarations for a given target (WIP: DOESN'T WORK FOR NOW)
### Args:
# Extension target name
# HEADERS - list of headers to be used to generate TS declarations
# TARGET_ABI - target ABI, if non provided the CMAKE_CXX_COMPILER_TARGET value will be used

# function(ts_generate_declarations NAME ...)
#     cmake_parse_arguments (PARSE_ARGV 1 "ARG"
#         ""
#         "TARGET_ABI;TS_MODULE_NAME"
#         "HEADERS"
#     )

#     set(EXT_DECL "${NAME}_decl") # Do we really need it in parent scope?
#     add_custom_target(${EXT_DECL} ALL)

#     # FIXME: hack due to incorrent internal script
#     set_target_properties(${EXT_DECL}
#         PROPERTIES LINK_LIBRARIES "" 
#     )

#     if (NOT ARG_HEADERS OR ARG_HEADERS STREQUAL "")
#         message (FATAL_ERROR "No HEADERS provided to declarate declarations from")
#     endif ()

#     set (TARGET_ABI )
#     if (NOT ARG_TARGET_ABI OR ARG_TARGET_ABI STREQUAL "")
#         message (VERBOSE "No TARGET_ABI argument provided. Trying to use CMAKE_CXX_COMPILER_TARGET")
#         if (NOT CMAKE_CXX_COMPILER_TARGET OR ${CMAKE_CXX_COMPILER_TARGET} STREQUAL "")
#             message (FATAL_ERROR "Failed to detect target ABI!")
#         else()
#             set (TARGET_ABI ${CMAKE_CXX_COMPILER_TARGET})
#         endif()
#     else()
#         set (TARGET_ABI ${ARG_TARGET_ABI})
#     endif ()

#     message(STATUS "Declarator: TARGET_ABI is ${TARGET_ABI}")

#     set(IMPORT "")
#     set(declaration_list )

#     generate_declarations(
#         ${EXT_DECL}
#         ${NAME}
#         ${ARG_HEADERS}
#         ${TARGET_ABI}
#         ""
#         ${CMAKE_CURRENT_BINARY_DIR}
#         declaration_list
#     )

#     generate_index(
#         ${NAME}
#         "ts"
#         "${declaration_list}" 
#         "cpp"
#         "${CMAKE_CURRENT_BINARY_DIR}"
#     )

#     set_target_properties(${NAME} PROPERTIES
#         DEFINITIONS ""
#     )

#     set(TS_EXTENSION_DECLARATIONS_TARGET ${TS_EXTENSION_DECLARATIONS_TARGET} PARENT_SCOPE) # Do we really need it in parent scope?
# endfunction()


endif() # __ts_build_utils_cmake_guard
