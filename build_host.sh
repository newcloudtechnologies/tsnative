#!/bin/sh
#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

echo "Building host targets..."

CURRENT_DIR=$(cd `dirname $0` && pwd)
OUT_DIR="${CURRENT_DIR}/out"
BUILD_DIR="${OUT_DIR}/build"
INSTALL_DIR="${OUT_DIR}/install"

export CONAN_USER_HOME="${OUT_DIR}"

mkdir -p ${BUILD_DIR}
mkdir -p ${INSTALL_DIR}

PROJECT_BUILD_DIR="${BUILD_DIR}"

GENERATOR="Unix Makefiles"
PLATFORM=""

if [ "$OSTYPE" == "msys" ]; then
    GENERATOR="Visual Studio 16 2019"
    PLATFORM="-Ax64"
fi

if [ "$(uname -s)" == "Darwin" ]; then
    JOBS_NUM=$(sysctl -n hw.ncpu)
else
    JOBS_NUM=$(expr $(nproc) + 1)
fi

cmake -G "$GENERATOR" "$PLATFORM" \
    -S "${CURRENT_DIR}" \
    -B ${PROJECT_BUILD_DIR} \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX:STRING="$INSTALL_DIR" \
    -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON

cmake --build ${PROJECT_BUILD_DIR} --config Release -j${JOBS_NUM} --target install

# if [[ "$OSTYPE" == "msys" ]]; then
# 	cmake --build ${BUILD_DIR} --config Release -j${JOBS_NUM}
# 	mv ${OUTPUT_DIR}/Release/declarator.exe ${OUTPUT_DIR}/declarator.exe
# 	rm -rf ${OUTPUT_DIR}/Release
# else
# 	cd ${BUILD_DIR} && make -j${JOBS_NUM}
# fi


