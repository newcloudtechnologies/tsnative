#!/bin/bash
#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

# set -xe

echo "start tsnative..."
echo "arguments passed: $@"

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    --tsnative_root)
    TSNATIVE_ROOT="$2"
    shift # past argument
    shift # past value
    ;;
    --conan_install)
    CONAN_INSTALL_DIR="$2"
    shift # past argument
    shift # past value
    ;;
    --tsconfig)
    TS_CONFIG="$2"
    shift # past argument
    shift # past value
    ;;
    --source)
    PROJECT_ENTRY_NAME="$2"
    shift # past argument
    shift # past value
    ;;
    --extension)
    PROJECT_TS_EXTENSION_DIR="$2"
    shift # past argument
    shift # past value
    ;;
    --output)
    PROJECT_OUTPUT_BINARY="$2"
    shift # past argument
    shift # past value
    ;;
    --build)
    PROJECT_BUILD_DIR="$2"
    shift # past argument
    shift # past value
    ;;
    --project_root)
    PROJECT_ROOT="$2"
    shift # past argument
    shift # past value
    ;;
    --baseUrl)
    PROJECT_BASE_URL="$2"
    shift # past argument
    shift # past value
    ;;
    --trace)
    TRACE_IMPORT=TRUE
    shift # past argument
    ;;
    --target_abi)
    TARGET_ABI="$2"
    shift # past argument
    shift # past value
    ;;
    --print_ir)
    PRINT_IR=TRUE
    shift # past argument
    ;;
    --test)
    IS_TEST=TRUE
    shift # past argument
    ;;
    --debug)
    TS_DEBUG=TRUE
    shift # past argument
    ;;
    --profile_build)
    TS_PROFILE_BUILD=TRUE
    shift # past argument
    ;;
    --run_event_loop)
    TS_RUN_EVENT_LOOP=TRUE
    shift # past argument
    ;;
    --jobs)
    JOBS_NUM="$2"
    shift # past argument
    shift # past value
    ;;
    --help)
    echo "Available options:"
    echo "  --tsnative_root : specify path to tsnative root dir (default: <project>/node_modules/tsnative)"
    echo "  --project_root : specify path to project root (default: <tsnative_root>/../..)"
    echo "  --build : specify path to build dir (default: <project_dir>/build"
    echo "  --output : specify path to output binary (default: <build>/<source-file-name-without-ts-extension>"
    echo "  --baseUrl : specify base dir to resolve modules from"
    echo "  --target_abi : specify ABI that should be used to generate declarations"
    echo "  --tsconfig : specify path to tsconfig.json"
    echo "  --source : specify path to entry (usually main.ts)"
    echo "  --extension : specify path to extension dir"
    echo "  --print_ir : print ir code"
    echo "  --test : passing this key will enable test target for specified entry that can be later fun using 'make test' command"
    echo "  --debug : generate debug info"
    echo "  --profile_build : build time statistics"
    echo "  --run_event_loop : Run event loop"
    echo "  --jobs : number of build jobs"
    exit 0
    shift # past argument
    ;;
    *)
    echo "Unknown commandline option: ${key}"
    exit 1
    ;;
esac
done

if [ -z "$PROJECT_ENTRY_NAME" ]
then
    echo "tsnative: Entry name cannot be empty. Please provide one with --source option"
    exit 1;
fi

if [ ! -f "$PROJECT_ENTRY_NAME" ]; then
    echo "tsnative. Cannot find entry $PROJECT_ENTRY_NAME. Please provide existing entry with --source option"
    exit 1;
fi

# npm installs tsnative.sh script into node_modules/.bin
CURRENT_DIR=$(cd `dirname $0` && pwd)

if [ -z "$TSNATIVE_ROOT" ]
then
    TSNATIVE_ROOT="${CURRENT_DIR}"
fi

if [ -z "$PROJECT_ROOT" ]
then
    PROJECT_ROOT="${TSNATIVE_ROOT}"
fi

if [ -z "$PROJECT_BUILD_DIR" ]
then
    mkdir -p ${PROJECT_ROOT}/build
    PROJECT_BUILD_DIR="${PROJECT_ROOT}/build"
fi

if [ -z "$PROJECT_OUTPUT_BINARY" ]
then
    FILENAME="${PROJECT_ENTRY_NAME##*/}"
    PROJECT_OUTPUT_BINARY="$PROJECT_BUILD_DIR/${FILENAME%.*}"
fi

if [ -z "$PROJECT_OUTPUT_BINARY" ]
then
    FILENAME="${PROJECT_ENTRY_NAME##*/}"
    PROJECT_OUTPUT_BINARY="$PROJECT_BUILD_DIR/${FILENAME%.*}"
fi

if [ -z "$PROJECT_BASE_URL" ]
then
    PROJECT_BASE_URL="${TSNATIVE_ROOT}"
fi

if [ -z "$TS_CONFIG" ]
then
    TS_CONFIG="${TSNATIVE_ROOT}/tsconfig.json"
fi

if [ -z "$IS_TEST" ]
then
    IS_TEST=FALSE
fi

if [ -z "$PRINT_IR" ]
then
    PRINT_IR=FALSE
fi

if [ -z "$TS_PROFILE_BUILD" ]
then
    TS_PROFILE_BUILD=FALSE
fi

if [ "$(uname -s)" == "Darwin" ]; then
    JOBS_NUM=$(sysctl -n hw.ncpu)
else
    JOBS_NUM=$(expr $(nproc) + 1)
fi

CMAKE_DIR="${TSNATIVE_ROOT}"

# TODO: make build type configurable
# CMAKE_FIND_ROOT_PATH
# CMAKE_STAGING_PREFIX

cmake -G "Unix Makefiles" \
    -B ${PROJECT_BUILD_DIR} \
    -S ${CMAKE_DIR} \
    -DCMAKE_BUILD_TYPE=Release \
    -DTSNATIVE_ROOT=${TSNATIVE_ROOT} \
    -DPROJECT_ROOT=${PROJECT_ROOT} \
    -DPROJECT_BUILD_DIR=${PROJECT_BUILD_DIR} \
    -DPROJECT_TS_EXTENSION_DIR=${PROJECT_TS_EXTENSION_DIR} \
    -DPROJECT_OUTPUT_BINARY=${PROJECT_OUTPUT_BINARY} \
    -DPROJECT_ENTRY_NAME=${PROJECT_ENTRY_NAME} \
    -DPROJECT_BASE_URL=${PROJECT_BASE_URL}\
    -DCONAN_INSTALL_DIR=${CONAN_INSTALL_DIR} \
    -DTS_CONFIG=${TS_CONFIG} \
    -DTRACE_IMPORT=${TRACE_IMPORT} \
    -DPRINT_IR=${PRINT_IR} \
    -DIS_TEST=${IS_TEST} \
    -DCMAKE_CXX_COMPILER_TARGET=$TARGET_ABI \
    -DCMAKE_TOOLCHAIN_FILE=${CONAN_INSTALL_DIR}/conan_paths.cmake \
    -DTS_DEBUG=${TS_DEBUG} \
    -DTS_PROFILE_BUILD=${TS_PROFILE_BUILD} \
    -DTS_RUN_EVENT_LOOP=${TS_RUN_EVENT_LOOP}
    # -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON

cmake --build ${PROJECT_BUILD_DIR} --config Release -j${JOBS_NUM}

