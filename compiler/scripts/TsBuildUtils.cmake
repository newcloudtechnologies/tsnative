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

function(getProjectFiles entry projectFiles)
    file(GLOB_RECURSE project_files ${PROJECT_ROOT}/*.ts)

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

function(instantiate_classes target dep_target entry sources includes output_dir trace_opt classes_src)
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
                        # TODO: use generator expressions: --includeDirs "\'$<TARGET_PROPERTY:tsnative-std,INTERFACE_INCLUDE_DIRECTORIES>\'"
                        ${INCLUDE_DIRS}
                        --templatesOutputDir ${output_dir}
                        --build ${output_dir}
                        ${trace_opt}
    )

    add_custom_target(${target}
        DEPENDS ${output})

    add_dependencies(${target} ${dep_target})

    set(${classes_src} ${output} PARENT_SCOPE)
endfunction()

function(instantiate_functions target dep_target entry sources includes output_dir demangledList mangledList trace_opt functions_src)
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
                        --processTemplateFunctions 
                        # TODO: use generator expressions: --includeDirs $<TARGET_PROPERTY:tsnative-std,INTERFACE_INCLUDE_DIRECTORIES>
                        ${INCLUDE_DIRS}
                        --demangledTables ${DEMANGLED}
                        --mangledTables ${MANGLED}
                        --templatesOutputDir ${output_dir}
                        --build ${output_dir}
                        ${trace_opt}
    )

    add_custom_target(${target}
        DEPENDS ${output})

    add_dependencies(${target} ${dep_target})

    set(${functions_src} ${output} PARENT_SCOPE)
endfunction()

function(compile_cpp target dep_target includes definitions entry output_dir compiled)
    get_filename_component(bin_name "${entry}" NAME)

    # TODO: refactor this whole sequence
    # 1 use object library
    add_library(${target} STATIC ${entry})
    set_target_properties(${target} PROPERTIES
        ARCHIVE_OUTPUT_DIRECTORY ${output_dir}
        ARCHIVE_OUTPUT_NAME ${bin_name})

    target_include_directories(${target} PUBLIC ${tsnative-declarator_INCLUDE_DIRS})
    target_link_libraries(${target} PUBLIC tsnative-std::tsnative-std tsnative-declarator)

    if (NOT "${TS_EXTENSION_TARGET}" STREQUAL "fake")
        target_link_libraries(${target} PRIVATE ${TS_EXTENSION_TARGET})
    endif()

    # 2 use $<TARGET_FILE:${target}> to obtain output file name later for nm
    set (output ${output_dir}/${CMAKE_STATIC_LIBRARY_PREFIX}${bin_name}${CMAKE_STATIC_LIBRARY_SUFFIX})

    add_dependencies(${target} ${dep_target})
    # 3 simplify structure!
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

function(compile_ts target dep_target entry sources demangledList mangledList output_dir is_printIr trace_opt ll_bytecode is_debug)
    get_filename_component(entry_fn "${entry}" NAME)

    string(REPLACE ".ts" ".ll" OUTPUT_FN "${entry_fn}")
    string(REPLACE ";" ", " DEMANGLED "${demangledList}")
    string(REPLACE ";" ", " MANGLED "${mangledList}")

    set(output "${output_dir}/${OUTPUT_FN}")

    set(PRINT_IR )
    if (${is_printIr})
        set(PRINT_IR --printIR)
    endif()

    set(TS_DEBUG )
    if (${is_debug})
        set(TS_DEBUG --debug)
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS "${entry}" "${sources}" "${demangledList}" "${mangledList}"
        WORKING_DIRECTORY ${PROJECT_ROOT}
        COMMAND echo "Running TS compiler: ${entry}"
        COMMAND ${TS_COMPILER}
        ARGS ${entry} --tsconfig ${TS_CONFIG}
                      --baseUrl ${PROJECT_BASE_URL}
                      --demangledTables ${DEMANGLED}
                      --mangledTables ${MANGLED}
                      --build ${output_dir}
                      --emitIR
                      ${PRINT_IR}
                      ${trace_opt}
                      ${TS_DEBUG}
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
            tsnative-std::tsnative-std
    )

    if (NOT "${TS_EXTENSION_TARGET}" STREQUAL "fake")
        target_link_libraries(${${target}} PRIVATE ${TS_EXTENSION_TARGET})
    endif()


    add_dependencies(${${target}} ${dep_target})
endfunction()

function(build target dep_target entry includes dependencies definitions optimization_level is_test is_printIr trace_import is_debug)
    message(STATUS "Build TS:")
    message(STATUS "--target=${target}")
    message(STATUS "--dep_target=${dep_target}")
    message(STATUS "--entry=${entry}")
    message(STATUS "--includes=${includes}")
    message(STATUS "--dependencies=${dependencies}")
    message(STATUS "--definitions=${definitions}")
    message(STATUS "--optimization_level=${optimization_level}")
    message(STATUS "--is_test=${is_test}")
    message(STATUS "--is_printIr=${is_printIr}")
    message(STATUS "--trace_import=${trace_import}")
    message(STATUS "--debug=${is_debug}")

    set(TRACE_OPT)
    if (${trace_import})
        set(TRACE_OPT "--trace")
    endif()

    # Collect all project's *.ts source files to enable incremental build
    getProjectFiles("${entry}" sources)

    getBinaryName("${entry}" binary_name)

    makeOutputDir(makeOutputDir_${binary_name} ${dep_target} "${entry}" output_dir)

    # TODO: restore verifier
    # verify_ts(verify_ts_${binary_name} makeOutputDir_${binary_name} "${entry}" "${sources}" "${output_dir}")

    instantiate_classes(instantiate_classes_${binary_name} makeOutputDir_${binary_name} "${entry}" "${sources}" "${includes}" "${output_dir}" "${TRACE_OPT}" CLASSES_SRC)

    compile_cpp(compile_classes_${binary_name} instantiate_classes_${binary_name} "${includes}" "${definitions}" "${CLASSES_SRC}" "${output_dir}" COMPILED_CLASSES)

    extractSymbols(extract_classes_symbols_${binary_name} compile_classes_${binary_name} "${COMPILED_CLASSES}" "${output_dir}" COMPILED_CLASSES_DEMANGLED_NAMES COMPILED_CLASSES_MANGLED_NAMES)

    instantiate_functions(instantiate_functions_${binary_name} extract_classes_symbols_${binary_name} "${entry}" "${sources}" "${includes}" "${output_dir}" "${COMPILED_CLASSES_DEMANGLED_NAMES}" ${COMPILED_CLASSES_MANGLED_NAMES} "${TRACE_OPT}" FUNCTIONS_SRC)

    compile_cpp(compile_functions_${binary_name} instantiate_functions_${binary_name} "${includes}" "${definitions}" "${FUNCTIONS_SRC}" "${output_dir}" COMPILED_FUNCTIONS)

    list(PREPEND DEPENDENCIES ${COMPILED_CLASSES} ${COMPILED_FUNCTIONS})

    extractSymbols(extract_symbols_${binary_name} compile_functions_${binary_name} "${DEPENDENCIES}" "${output_dir}" DEMANGLED_NAMES MANGLED_NAMES)

    compile_ts(compile_ts_${binary_name} extract_symbols_${binary_name} "${entry}" "${sources}" "${DEMANGLED_NAMES}" "${MANGLED_NAMES}" "${output_dir}" "${is_printIr}" "${TRACE_OPT}" LL_BYTECODE "${is_debug}")

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

endif() # __ts_build_utils_cmake_guard
