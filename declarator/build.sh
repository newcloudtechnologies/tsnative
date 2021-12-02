#!/bin/sh
#
# Copyright (c) New Cloud Technologies, Ltd., 2013-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

echo "Building declarator..."

CURRENT_DIR=$(cd `dirname $0` && pwd)
BUILD_DIR="${CURRENT_DIR}/../out/declarator/build"
OUTPUT_DIR="${CURRENT_DIR}/../bin"

mkdir -p ${BUILD_DIR}
mkdir -p ${OUTPUT_DIR}

BUILD_DIR=$(readlink -f ${BUILD_DIR})
OUTPUT_DIR=$(readlink -f ${OUTPUT_DIR})

GENERATOR="Unix Makefiles"
PLATFORM=""

if [[ "$OSTYPE" == "msys" ]]; then
    GENERATOR="Visual Studio 16 2019"
    PLATFORM="-Ax64"
fi

cmake -G "$GENERATOR" "$PLATFORM" \
    -B ${BUILD_DIR} \
    -S ${CURRENT_DIR} \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_RUNTIME_OUTPUT_DIRECTORY=${OUTPUT_DIR} \
    -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON

if [[ "$OSTYPE" == "msys" ]]; then
	cmake --build ${BUILD_DIR} --config Release -j$(expr $(nproc) + 1)
	mv ${OUTPUT_DIR}/Release/declarator.exe ${OUTPUT_DIR}/declarator.exe
	rm -rf ${OUTPUT_DIR}/Release
else
	cd ${BUILD_DIR} && make -j$(expr $(nproc) + 1)
fi


