#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

find_package(tsnative-std REQUIRED)

if(${CMAKE_VERSION} VERSION_LESS "3.18.0")
    find_program(llcBin tsnative-llc)
    if (NOT llcBin)
        message(FATAL_ERROR "tsnative-llc not found")
    endif()
else()
    find_program(llcBin tsnative-llc REQUIRED)
endif()

set (nmBin ${CMAKE_NM})

if (${TS_PROFILE_BUILD})
    message(STATUS "Enable TsBuildUtils2 profiler")
    find_package(Python)
    # Cmake's subcommand 'env' looks strange here but gives more portable.
    # Semicolons to avoid quoting.
    set(BUILD_TIME_PROFILER_CMD "env;${Python_EXECUTABLE};${CMAKE_CURRENT_LIST_DIR}/build_time_profiler.py")
endif()

set(_noop               true)
set(_isProfiling        $<BOOL:${TS_PROFILE_BUILD}>)
set(PROFILER_CMD_START  $<IF:${_isProfiling},${BUILD_TIME_PROFILER_CMD} --start --tag,${_noop}>)
set(PROFILER_CMD_END    $<IF:${_isProfiling},${BUILD_TIME_PROFILER_CMD} --end --tag,${_noop}>)
set(PROFILER_CMD_RESULT $<IF:${_isProfiling},${BUILD_TIME_PROFILER_CMD} --calculate --tag,${_noop}>)

# CMake return wrong value for this inside the function and do not
# point to this file.
set(CACHED_CMAKE_CURRENT_LIST_DIR ${CMAKE_CURRENT_LIST_DIR})

#
# Creates two libraries - one with compiled ts code and another, that has _main suffix, with the default
# main() proc provided by the compiler runtime(seed.cpp). If you use a custom main(), do not link with
# the second library.
# Args:
#  NAME      Target's name. There will be created two targets: ${NAME} and ${NAME}_main
#  SRC       Path to a main ts source file.
#  BASE_URL  Path to a directory containing declarations used by main ts file.
#  TS_CONFIG Path to tsconfig.json.
#  LIBRARIES Targets for libraries that has cpp extensions code. See MGT::ts library for example.
#
# Optional args:
#  TS_DEBUG       Compile user code in the debug mode
#  PRINT_IR       Print IR code to console.
#  TRACE_IMPORT   Enable ts module resolution tracing
#  OPT_LEVEL      Optimization level that will be passed to llc "as is"
#  RUN_EVENT_LOOP <lock|oneshot> Make compiler embed code that starts internal event loop automatically.
#  WATCH_SOURCES  List of files, because of changes in which, it is necessary to rebuild the project.
#                 If not provided, the all sources from the directory containing main ts file will be used as
#                 the files from TS_HEADERS property defined in LIBRARIES targets.
#
function (add_ts_library ARG_NAME ...)
    set(options )
    set(oneValueArgs SRC TS_CONFIG BASE_URL TS_DEBUG PRINT_IR TRACE_IMPORT OPT_LEVEL RUN_EVENT_LOOP)
    set(multiValueArgs DEFINES LIBRARIES WATCH_SOURCES)

    cmake_parse_arguments(PARSE_ARGV 1 "ARG" "${options}" "${oneValueArgs}" "${multiValueArgs}")

    if (DEFINED ARG_UNPARSED_ARGUMENTS)
        message(FATAL_ERROR "You have unparsed arguments: '${ARG_UNPARSED_ARGUMENTS}'")
    endif()

    _requiredArgs(ARG_SRC ARG_TS_CONFIG)

    get_filename_component(ARG_SRC ${ARG_SRC} ABSOLUTE)
    get_filename_component(ARG_TS_CONFIG ${ARG_TS_CONFIG} ABSOLUTE)

    set(targetName ${ARG_NAME})
    set(mainTs ${ARG_SRC})
    set(definitions ${ARG_DEFINES})

    set(libraries tsnative-std::tsnative-std)
    if (DEFINED ARG_LIBRARIES)
        list(PREPEND libraries ${ARG_LIBRARIES})
    endif()

    set(baseFlags --tsconfig;${ARG_TS_CONFIG})
    if (DEFINED ARG_BASE_URL)
        list (APPEND baseFlags --baseUrl;${ARG_BASE_URL})
    endif()

    set(extraFlags 
        $<$<BOOL:${ARG_PRINT_IR}>:--printIR;>
        $<$<BOOL:${ARG_TS_DEBUG}>:--debug;>
        $<$<BOOL:${ARG_TRACE_IMPORT}>:--trace;>
        $<$<BOOL:${ARG_RUN_EVENT_LOOP}>:--runEventLoop ${ARG_RUN_EVENT_LOOP};>
    )
    set(watchSources ${ARG_WATCH_SOURCES})
    set(outputDir ${CMAKE_CURRENT_BINARY_DIR}/compile_lib${targetName})

    _printVar(targetName)
    _printVar(mainTs)
    _printVar(definitions)
    _printVar(libraries)

    # Stages 0-2 produce files with mangled and demangled names for input targets(libraries),
    #   instantiated classes and functions. And add them to two lists: mangledTables and demangledTables.
    # Stage 3 compiles mainTs and produces an IR bytecode.
    # Stage 4 compiles IR to an object file.
    # Stage 5 compiles seed and creates an object library.

    # These top-level targets will be created.

    set(stage0 "${targetName}_extract_symbols")
    set(stage1 "${targetName}_instantiated_classes")
    set(stage2 "${targetName}_instantiated_functions")

    set(mangledTables )
    set(demangledTables )

    set(includeDirs )
    list(APPEND includeDirs ${tsnative-std_INCLUDE_DIR})

    # Stage 0

    _add_nm_target(${stage0} mangledTables demangledTables
        LIBRARIES ${libraries}
        OUTPUT_DIR ${outputDir}
        DEPENDS ${libraries}
    )

    # Stage 1

    # This is a macro. It checks if ARG_WATCH_SOURCES is defined.
    # - If not, it collects sources as mentioned in this function docs.
    #   Sets watchSources var.
    # - If defined, do nothing.
    _collectWatchSources()

    _addStage(${stage1} ${stage0} "instantiated_classes.cpp" --processTemplateClasses)
    _addStage(${stage2} ${stage1} "instantiated_functions.cpp" --processTemplateFunctions)

    # Stage 2

    get_filename_component(llFile ${mainTs} NAME_WLE)
    set(llFile ${outputDir}/${llFile}.ll)

    _add_ts_command(${mainTs}
        OUTPUT ${llFile}
        MANGLED ${mangledTables}
        DEMANGLED ${demangledTables}
        FLAGS ${baseFlags};${extraFlags};--emitIR
        DEPENDS ${stage2}
    )

    # Stage 3

    string(REPLACE ".ll" ".cpp.o" objFile "${llFile}")
    add_custom_command(
        OUTPUT ${objFile}
        DEPENDS ${llFile}
        COMMENT "[TS2] ${llcBin}: ${llFile}"
        COMMAND ${CMAKE_COMMAND} -E "${PROFILER_CMD_START}" ${objFile}
        COMMAND ${llcBin}
            ${llFile}
            ${ARG_OPT_LEVEL}
            -relocation-model=pic
            -filetype=obj
            -mtriple ${CMAKE_CXX_COMPILER_TARGET}
            -o ${objFile}
        COMMAND ${CMAKE_COMMAND} -E "${PROFILER_CMD_END}" ${objFile}
        COMMAND_EXPAND_LISTS
    )

    # Stage 4

    add_library(${targetName} STATIC ${objFile})

    target_link_directories(${targetName} PUBLIC ${outputDir})
    target_link_libraries(${targetName} PUBLIC tsnative-std::tsnative-std ${stage1} ${stage2})

    # main()

    set(seedSrc ${CACHED_CMAKE_CURRENT_LIST_DIR}/seed/seed.cpp)
    set(seedIncludeDir ${CACHED_CMAKE_CURRENT_LIST_DIR}/seed)

    add_library(${targetName}_main OBJECT ${seedSrc})

    target_include_directories(${targetName}_main PUBLIC ${seedIncludeDir})
    target_link_libraries(${targetName}_main PUBLIC tsnative-std::tsnative-std)

    add_custom_command(
        TARGET ${targetName} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E "${PROFILER_CMD_RESULT}" ${targetName}
        COMMAND_EXPAND_LISTS
        VERBATIM
    )

endfunction() # add_ts_library

macro (_requiredArgs ...)
    foreach(arg ${ARGV})
        if (NOT DEFINED ${arg})
            message(FATAL_ERROR "Missing required argument: ${arg}")
        endif()
    endforeach()
endmacro()

macro (_printVar var)
    message(STATUS "[TS2] ${var}=${${var}}")
endmacro()

#
# Adds a custom command to call the compiler. Simplifies the use of generators by adding the necessary quoting.
#
function (_add_ts_command ARG_SRC ...)
    set(options )
    set(oneValueArgs OUTPUT)
    set(multiValueArgs MANGLED DEMANGLED FLAGS DEPENDS)

    cmake_parse_arguments(PARSE_ARGV 1 "ARG" "${options}" "${oneValueArgs}" "${multiValueArgs}")

    if (DEFINED ARG_UNPARSED_ARGUMENTS)
        message(FATAL_ERROR "You have unparsed arguments: '${ARG_UNPARSED_ARGUMENTS}'")
    endif()

    _requiredArgs(ARG_OUTPUT ARG_MANGLED ARG_DEMANGLED ARG_FLAGS)

    # Arguments
    set(flags ${ARG_FLAGS})
    set(inputFile ${ARG_SRC})
    set(outputFile ${ARG_OUTPUT})
    set(outputDir ${ARG_OUTPUT})
    set(mangledTable ${ARG_MANGLED})
    set(demangledTable ${ARG_DEMANGLED})
    set(dependencies ${ARG_DEPENDS})
    # XXX: We have to use comma-space separator bc of WinApi CommandLineToArgvW function that
    # cmake uses to parse command line arguments. It adds a strange prefix 'C;' to paths if we
    # use only comma to separate paths.
    set(commaSep "$<COMMA> ")

    get_filename_component(outputDir ${outputFile} DIRECTORY)

    # Globals
    set(tsCompiler tsnative-compiler)
    set(tsCompilerEnv ${TS_COMPILER_ENV})

    if (DEFINED TS_COMPILER)
        set(tsCompiler ${TS_COMPILER})
    endif()

    add_custom_command(
        OUTPUT ${outputFile}
        DEPENDS ${inputFile} ${dependencies}
        COMMENT "[TS2] ${tsCompiler}: ${outputFile}"
        COMMAND ${CMAKE_COMMAND} -E "${PROFILER_CMD_START}" ${ARG_OUTPUT}
        COMMAND ${CMAKE_COMMAND} -E env "${tsCompilerEnv}" ${tsCompiler}
        ARGS ${inputFile}
            --build ${outputDir}
            --mangledTables "$<JOIN:${mangledTable},${commaSep}>"
            --demangledTables "$<JOIN:${demangledTable},${commaSep}>"
            "$<$<BOOL:${includeDirs}>:--includeDirs>" "$<JOIN:${includeDirs},${commaSep}>"
            "${flags}"
        COMMAND ${CMAKE_COMMAND} -E "${PROFILER_CMD_END}" ${ARG_OUTPUT}
        COMMAND_EXPAND_LISTS
        VERBATIM
    )
endfunction()

#
# Adds a custom command that generates two symbol tables from the provided library's target.
# This command is added to a specific target and executed whenever the target is built.
# The target have to be declared in the same directory that this file is included from.
# Args:
#  TARGET  The target that the command is associated to.
#
function (_add_nm_command ARG_TARGET)
    set(libName $<TARGET_FILE_NAME:${ARG_TARGET}>)
    set(libPath $<TARGET_FILE:${ARG_TARGET}>)
    set(outputDir $<TARGET_FILE_DIR:${ARG_TARGET}>)

    set(mangledPath "${outputDir}/${libName}.m.nm")
    set(demangledPath "${outputDir}/${libName}.dm.nm")

    add_custom_command(
        TARGET ${ARG_TARGET} POST_BUILD
        COMMAND ${nmBin} ${libPath} > ${mangledPath}
        COMMAND ${nmBin} -C ${libPath} > ${demangledPath}
        COMMENT "[TS2] _add_nm_command: ${ARG_TARGET}"
        VERBATIM
    )
endfunction()

#
# Same as a previous function _add_nm_command but for the targets that is _not_ defined
# in current directory. It creates a custom target to which the custom commands will be
# added. This cmake's feature, that is called build events, cannot be applied to the
# targets that is not defined in current CMakeLists.txt.
# Note. Need to clarify the situation about targets in add_subdirectory().
# Args:
#  NAME          Target that will be created.
#  OUT_MANGLED   Output lists to which paths to symbol tables will be added.
#  OUT_DEMANGLED
#  LIBRARIES     Targets or full paths to libraries that the symbols have to be generated from.
#  DEPENDS       The targets after which this target should be executed.
#
function (_add_nm_target ARG_NAME ARG_OUT_MANGLED ARG_OUT_DEMANGLED)
    set(options )
    set(oneValueArgs OUTPUT_DIR)
    set(multiValueArgs DEPENDS LIBRARIES)

    cmake_parse_arguments(PARSE_ARGV 3 "ARG" "${options}" "${oneValueArgs}" "${multiValueArgs}")

    if (DEFINED ARG_UNPARSED_ARGUMENTS)
        message(FATAL_ERROR "You have unparsed arguments: '${ARG_UNPARSED_ARGUMENTS}'")
    endif()

    _requiredArgs(ARG_OUTPUT_DIR ARG_LIBRARIES ARG_DEPENDS)

    set(libs ${ARG_LIBRARIES})
    set(outputDir ${ARG_OUTPUT_DIR})
    set(dependency ${ARG_DEPENDS})
    set(mainTarget ${ARG_NAME})

    set(targetSuffix )
    set(mangledList )
    set(demangledList )

    # XXX: Custom target is always out-of-date so all attached commands will be run
    # everytime!
    add_custom_target(${mainTarget})

    foreach(library ${libs})
        if (TARGET ${library})
            set(libName $<TARGET_FILE_NAME:${library}>)
            set(libPath $<TARGET_FILE:${library}>)
        else()
            # If we drop support for legacy style calls, we can just use _add_nm_command inside the loop.
            set(libName )
            set(libPath ${library})
            get_filename_component(libName ${libPath} NAME)
        endif()

        set(mangledPath "${outputDir}/${libName}.m.nm")
        set(demangledPath "${outputDir}/${libName}.dm.nm")

        add_custom_command(
            TARGET ${mainTarget} POST_BUILD
            COMMAND ${nmBin} "${libPath}" > "${mangledPath}"
            COMMAND ${nmBin} -C "${libPath}" > "${demangledPath}"
            COMMENT "[TS2] Generating symbols for ${library}"
            DEPENDS "${libPath}"
            VERBATIM
        )

        list(APPEND mangledList ${mangledPath})
        list(APPEND demangledList ${demangledPath})
    endforeach()

    set(${ARG_OUT_MANGLED} ${mangledList} PARENT_SCOPE)
    set(${ARG_OUT_DEMANGLED} ${demangledList} PARENT_SCOPE)
endfunction()

#
# There are 3 macro below that should be called from add_ts_library() only.
# They are designed to make it easier to understand the main function's stages.
# Please, keep them simple and do not add extra logic except that was described
# in the caller!
#

macro (_collectWatchSources)
    if (NOT DEFINED ARG_WATCH_SOURCES)
        get_filename_component(_watchDir ${mainTs} DIRECTORY)
        file(GLOB_RECURSE _watchSources ${_watchDir}/*.ts)

        message(STATUS "[TS2] Watching ts sources in: ${_watchDir}")

        foreach (lib ${libraries})
            # These are cxx headers but if they were changed so the declarations were changed too...
            list(APPEND _watchSources $<TARGET_PROPERTY:${lib},TS_HEADERS>)
        endforeach()

        set(watchSources ${_watchSources})
        set(_watchSources)
        set(_watchDir)
    else()
        message(STATUS "[TS2] Watching user provided ts sources.")
    endif()
endmacro()

macro (_addStage ARG_STAGE ARG_DEPENDS ARG_FILENAME ARG_FLAG)
    set(cppFile ${outputDir}/${ARG_FILENAME})
    set(cppTarget ${ARG_STAGE})

    # Generating .cpp file

    _add_ts_command(${mainTs}
        OUTPUT ${cppFile}
        MANGLED ${mangledTables}
        DEMANGLED ${demangledTables}
        FLAGS ${baseFlags};${ARG_FLAG};--templatesOutputDir;${outputDir}
        DEPENDS ${ARG_DEPENDS} ${watchSources}
    )

    # Compile .cpp file

    add_library(${cppTarget} STATIC ${cppFile})

    target_link_libraries(${cppTarget} PUBLIC ${libraries} tsnative-std::tsnative-std)
    set_target_properties(${cppTarget} PROPERTIES ARCHIVE_OUTPUT_DIRECTORY ${outputDir})

    # Extract symbols from .cpp file

    _add_nm_command(${cppTarget})

    # Add symbols to "global" table

    list(APPEND mangledTables $<TARGET_FILE:${cppTarget}>.m.nm)
    list(APPEND demangledTables $<TARGET_FILE:${cppTarget}>.dm.nm)
endmacro()

