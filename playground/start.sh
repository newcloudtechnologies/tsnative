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

echo "Start..."

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
    SOURCE="$2"
    shift # past argument
    shift # past value
    ;;
    --extension)
    EXTENSION="$2"
    shift # past argument
    shift # past value
    ;;
    --print_ir)
    PRINT_IR=true
    shift # past argument
    ;;
    *)
    echo "Unknown commandline option: ${key}"
    shift
    ;;
esac
done

SRCDIR=$(readlink -f ${CURRENT_DIR}/..)

STAGE_DIR=$(dirname "${SOURCE}")

if [ -n "${EXTENSION+x}" ]; then
    ln -rs ${EXTENSION} ${CURRENT_DIR}/extension
fi

mkdir -p ${CURRENT_DIR}/build
cd ${CURRENT_DIR}/build

cmake \
    -DCMAKE_BUILD_TYPE=release \
    -DSRCDIR=${SRCDIR} \
    -DSOURCE=${SOURCE} \
    -DTS_CONFIG=${TS_CONFIG} \
    -DSTAGE_DIR=${STAGE_DIR} \
    -DEXTENSION=${EXTENSION} \
    -DPRINT_IR=${PRINT_IR} \
    ..

make -j$(expr 2 \* $(cat /proc/cpuinfo | grep "processor" | wc -l))



