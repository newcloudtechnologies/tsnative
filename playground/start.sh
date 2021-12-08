#!/bin/bash
#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

echo "Starting playground..."

echo "Args: $@"

CURRENT_DIR=$(cd `dirname $0` && pwd)

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
    ENTRY="$2"
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

PROJECT_DIR=$(readlink -f ${CURRENT_DIR}/..)
STAGE_DIR=$(dirname "${ENTRY}")

if [ -n "${EXTENSION+x}" ]; then
    ln -sr ${EXTENSION} ${CURRENT_DIR}/extension
    ln -sr ${EXTENSION}/../node_modules ${CURRENT_DIR}/node_modules
fi

if [ -z "$BUILD" ]
then
    BUILD="${CURRENT_DIR}/../out/playground/build"
fi

rm -rf ${BUILD}
mkdir -p ${BUILD}
BUILD=$(readlink -f ${BUILD})

cmake -G "Unix Makefiles" \
    -B ${BUILD} \
    -S ${CURRENT_DIR} \
    -DCMAKE_BUILD_TYPE=release \
    -DPROJECT_DIR=${PROJECT_DIR} \
    -DENTRY=${ENTRY} \
    -DTS_CONFIG=${TS_CONFIG} \
    -DSTAGE_DIR=${STAGE_DIR} \
    -DEXTENSION=${EXTENSION} \
    -DOUTPUT_BINARY=${OUTPUT_BINARY} \
    -DBUILD=${BUILD} \
    -DPRINT_IR=${PRINT_IR} \
    -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON

cd ${BUILD} && make -j$(expr $(nproc) + 1)



