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

find_package(StdLib REQUIRED)
find_package(TsCompiler REQUIRED)
find_package(TsVerifier REQUIRED)

if (NOT StdLib_FOUND)
    message(FATAL_ERROR "stdlib not included")
endif()

if (NOT TsCompiler_FOUND)
    message(FATAL_ERROR "TS compiler is not found")
endif()

if (NOT TsVerifier_FOUND)
    message(FATAL_ERROR "TS verifier is not found")
endif()

if (NOT CMAKE_CXX_STANDARD)
    set(CMAKE_CXX_STANDARD 11)
endif()

function(makeOutputDir target dep_target entry output_dir)
    getBinaryName(${entry} binary_name)

    if("${BUILD}" STREQUAL "")
        set(dir "${CMAKE_CURRENT_BINARY_DIR}/${binary_name}.dir")
    else()
        set(dir "${BUILD}/${binary_name}.dir")
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
    if("${OUTPUT_BINARY}" STREQUAL "")
        get_filename_component(entry_fn ${entry} NAME)
        string(REPLACE ".ts" "" binary_name "${entry_fn}")
    else()
        get_filename_component(entry_fn "${OUTPUT_BINARY}" NAME)
        set(binary_name ${entry_fn})
    endif()

    set(${binaryName} ${binary_name} PARENT_SCOPE)
endfunction()

function(getBinaryPath binaryPath)
    if("${OUTPUT_BINARY}" STREQUAL "")
        set(binary_path "${STAGE_DIR}")
    else()
        get_filename_component(source_path "${OUTPUT_BINARY}" DIRECTORY)
        set(binary_path ${source_path})
    endif()

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
        WORKING_DIRECTORY ${PROJECT_DIR}
        COMMAND echo "Instantiating classes..."
        COMMAND ${TS_COMPILER}
        ARGS ${entry} --tsconfig ${TS_CONFIG} --processTemplateClasses ${INCLUDE_DIRS} --templatesOutputDir ${output_dir} --build ${output_dir}
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
        WORKING_DIRECTORY ${PROJECT_DIR}
        COMMAND echo "Instantiating functions..."
        COMMAND ${TS_COMPILER}
        ARGS ${entry} --tsconfig ${TS_CONFIG} --processTemplateFunctions ${INCLUDE_DIRS} --demangledTables ${DEMANGLED} --mangledTables ${MANGLED} --templatesOutputDir ${output_dir} --build ${output_dir}
    )

    add_custom_target(${target}
        DEPENDS ${output})

    add_dependencies(${target} ${dep_target})

    set(${functions_src} ${output} PARENT_SCOPE)
endfunction()

function(compile_cpp target dep_target includes definitions source output_dir compiled)
    string(REPLACE ".cpp" ".o" output "${source}")

    list(TRANSFORM includes PREPEND "-I")

    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${entry}
        WORKING_DIRECTORY ${output_dir}
        COMMAND echo "Compiling cpp..."
        COMMAND ${CMAKE_CXX_COMPILER}
        ARGS -std=c++${CMAKE_CXX_STANDARD} -c ${includes} ${definitions} ${entry}
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )
    
    add_dependencies(${target} ${dep_target})
    
    set(${compiled} ${output} PARENT_SCOPE)

    # get_filename_component(output "${source}" NAME_WE)
    # set(OBJECT_TARGET "${target}_${output}")

    # message("!!! output ${output}")
    # message("!!! OBJECT_TARGET ${OBJECT_TARGET}")

    # set(INCLUDESZ )
    # list(APPEND INCLUDESZ "${SRCDIR}/node_modules")
    # list(APPEND INCLUDESZ "${SRCDIR}/../node_modules")
    # list(APPEND INCLUDESZ "${SRCDIR}/..")
    # if (NOT "${includes}" STREQUAL "")
    #     list(APPEND INCLUDESZ "${includes}")
    # endif()
    # list(TRANSFORM INCLUDESZ PREPEND "-I")
    # add_library(${OBJECT_TARGET} OBJECT ${source})
    # target_compile_options(${OBJECT_TARGET} PUBLIC ${INCLUDESZ} ${definitions})
    # target_link_libraries(${OBJECT_TARGET} -L/Users/antiq/tsnative/std/lib -ltsnative-std)
    # if (ANDROID)
    #     target_compile_options(${OBJECT_TARGET} PUBLIC --target=${CMAKE_CXX_COMPILER_TARGET})
    # endif()
    # add_dependencies(${OBJECT_TARGET} ${dep_target})

    # set(OUTFILE "${CMAKE_CURRENT_BINARY_DIR}${CMAKE_FILES_DIRECTORY}/${OBJECT_TARGET}.dir/${binary_name}.dir/${output}.cpp.o")

    # add_custom_target(${target}
    #     DEPENDS ${OBJECT_TARGET} ${OUTFILE}
    # )

    # set(${compiled} ${OUTFILE} PARENT_SCOPE)
endfunction()


function(verify_ts target dep_target entry sources output_dir)
    get_filename_component(entry_fn "${entry}" NAME)

    string(REPLACE ".ts" ".js" OUTPUT_FN "${entry_fn}")
    set(output "${output_dir}/${OUTPUT_FN}")

    set(baseDir "${CMAKE_CURRENT_LIST_DIR}/..")

    add_custom_command(
        OUTPUT ${output}
        DEPENDS "${entry}" "${sources}"
        WORKING_DIRECTORY ${PROJECT_DIR}
        COMMAND echo "Running TS verifier: ${entry}"
        COMMAND ${TS_VERIFIER}
        ARGS ${entry} --alwaysStrict --target es6 --experimentalDecorators --moduleResolution node --baseUrl ${baseDir} --outDir ${output_dir}
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
        WORKING_DIRECTORY ${PROJECT_DIR}
        COMMAND echo "Running TS compiler: ${entry}"
        COMMAND ${TS_COMPILER}
        ARGS ${entry} --tsconfig ${TS_CONFIG} ${PRINT_IR} --emitIR --demangledTables ${DEMANGLED} --mangledTables ${MANGLED} --build ${output_dir}
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

function(link target dep_target seed_src compiled_source dependencies extra_dependencies)
    getBinaryPath(binaryPath)
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${binaryPath}")
    
    add_executable(${${target}} WIN32
        ${seed_src})

    if (NOT "extra_dependencies" STREQUAL "")
        target_link_libraries(${${target}}
            PRIVATE
                ${compiled_source}
                ${dependencies}
                ${extra_dependencies}
        )
    else()
        target_link_libraries(${${target}}
            PRIVATE
                ${compiled_source}
                ${dependencies}
        )
    endif()

    add_dependencies(${${target}} ${dep_target})
endfunction()

function(build target dep_target entry sources includes dependencies extra_dependencies definitions optimization_level is_test is_printIr)
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

    link(binary_name generate_seed_${binary_name} "${SEED_SRC}" "${COMPILED_SOURCE}" "${DEPENDENCIES}" "${extra_dependencies}")

    if(is_test)
        add_test(
            NAME ${binary_name} 
            COMMAND ${binary_name}
            WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR})
    endif()

    set(${target} ${binary_name} PARENT_SCOPE)
endfunction()
