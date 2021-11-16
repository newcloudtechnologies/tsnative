#!/bin/bash
#
# Copyright (c) New Cloud Technologies, Ltd., 2013-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

echo "start tsnative..."
echo "arguments passed: $@"

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    --tsconfig)
    TS_CONFIG="$2"
    shift # past argument
    shift # past value
    ;;
    --source)
    SOURCE="$2"
    shift # past argument
    shift # past value
    ;;
    --extension)
    EXTENSION="$2"
    shift # past argument
    shift # past value
    ;;
    --output)
    OUTPUT_BINARY="$2"
    shift # past argument
    shift # past value
    ;;
    --build)
    BUILD="$2"
    shift # past argument
    shift # past value
    ;;
    --print_ir)
    PRINT_IR=true
    shift # past argument
    ;;
    --help)
    echo "Available options:"
    echo "  --tsconfig : specify path to tsconfig.json"
    echo "  --source : specify path to entry (usually main.ts)"
    echo "  --extension : specify path to extension dir"
    echo "  --output_binary : specify path to output binary"
    echo "  --build : specify path to build dir"
    echo "  --print_ir : print ir code"
    exit 0
    shift # past argument
    ;;
    *)
    echo "Unknown commandline option: ${key}"
    exit 1
    ;;
esac
done

CURRENT_DIR=$(cd `dirname $0` && pwd)
PROJECT_DIR=$(readlink -f ${CURRENT_DIR}/../..)
CMAKE_DIR=$(readlink -f ${CURRENT_DIR}/../tsnative/cmake)
STAGE_DIR=$(dirname "${SOURCE}")

if [ -z "$BUILD" ]
then
    mkdir -p ${PROJECT_DIR}/build
    BUILD=${PROJECT_DIR}/build
fi

cmake -G "Unix Makefiles" \
    -B ${BUILD} \
    -S ${CMAKE_DIR} \
    -DCMAKE_BUILD_TYPE=release \
    -DPROJECT_DIR=${PROJECT_DIR} \
    -DSOURCE=${SOURCE} \
    -DTS_CONFIG=${TS_CONFIG} \
    -DSTAGE_DIR=${STAGE_DIR} \
    -DEXTENSION=${EXTENSION} \
    -DOUTPUT_BINARY=${OUTPUT_BINARY} \
    -DBUILD=${BUILD} \
    -DPRINT_IR=${PRINT_IR} \
    -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON

cd ${BUILD} && make -j$(expr 2 \* $(cat /proc/cpuinfo | grep "processor" | wc -l))


