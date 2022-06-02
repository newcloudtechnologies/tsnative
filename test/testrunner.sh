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

echo "Starting tests..."
echo "testrunner: arguments passed: $@"

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    --test-filter)
    TEST_FILTER="$2"
    shift # past argument
    shift # past value
    ;;
    --clean)
    CLEAN=true
    shift # past argument
    ;;
    --ff)
    FAST_FAIL=true
    shift # past argument
    ;;
    --help)
    echo "Available options:"
    echo "  --test-filter <filter> : simple grep-like expression to choose tests to run based on their names and paths"
    echo "  --clean : clean output directory before run"
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
INSTALL_DIR="${CURRENT_DIR}"
OUT_DIR="${CURRENT_DIR}/out"
BUILD_DIR="${OUT_DIR}"

if [ ! -z "$CLEAN" ]
then
    rm -rf $BUILD_DIR
fi

rm -rf ${BUILD_DIR}/CTestTestfile.cmake

mkdir -p ${BUILD_DIR}

# set directories containing tests
TEST_DIRS=( "${CURRENT_DIR}/src/app" \
            "${CURRENT_DIR}/src/basic" \
            "${CURRENT_DIR}/src/cpp_integration" \
            "${CURRENT_DIR}/src/cpp_closures" )

# basic filters to choose test files
INCLUDE_FILTER="*.ts"
EXCLUDE_FILTER=( "*.d.ts" )

EXCLUDE_FILTER+=("exceptions.ts")

# FIXME: AN-926
if [ "$OSTYPE" == "msys" ]; then
    EXCLUDE_FILTER+=("exceptions.ts")
fi

EXCLUDE_EXPR=
for filter in ${EXCLUDE_FILTER[@]}; do
    EXCLUDE_EXPR+="! -name ${filter} "
done

# ! extensions are expected to be located in the cpp directory near the test file
run_tests() {
    for dir in ${TEST_DIRS[@]}; do
        test_dir_name=${dir##*/}
        test_out_dir="$BUILD_DIR/$test_dir_name"

        mkdir -p ${test_out_dir}

        tests=$(find ${dir} -name "${INCLUDE_FILTER}" ${EXCLUDE_EXPR})

        # iterate over test files and build
        # TODO: run tests in parallel

        for test in $tests; do
            if [ ! -z "$TEST_FILTER" ]
            then
                tests=$(echo $tests | grep $TEST_FILTER )

                if [[ "$test" =~ "$TEST_FILTER" ]]
                then 
                    build_test "$test" "$test_out_dir" "$dir/cpp"
                fi
            else
                build_test "$test" "$test_out_dir" "$dir/cpp"
            fi
            if [[ $? != 0 ]] && [[ ! -z "$FAST_FAIL" ]]
            then
                exit 1;
            fi
        done

        # hack: concatenate CTestTestfile.cmake from each test into a single file
        # to have a nice report output
        for i in $(find ${test_out_dir} -name CTestTestfile.cmake); do
            cat "$i" >> ${BUILD_DIR}/CTestTestfile.cmake
        done

    done

    # run ctest using a concatenated CTestTestfile.cmake
    pushd ${BUILD_DIR} && ctest --output-on-failure && popd;
}

# $1 - full path to test file (*.ts)
# $2 - build directory
# $3 - full path to extensions directory (optional)
build_test() {
    echo "Test: $1 $2 $3"

    filename="${1##*/}"
    build_dir="$2/${filename%.*}"

    EXT_OPT=""
    if [ -d "$3" ]
    then
        EXT_OPT="--extension $3"
    fi

    echo "Build test $filename in $build_dir ($EXT_OPT)"

    tsnative.sh \
        --project_root ${CURRENT_DIR} \
        --conan_install ${INSTALL_DIR} \
        ${EXT_OPT} \
        --source $1 \
        --build ${build_dir} \
        --baseUrl ${INSTALL_DIR}/declarations \
        --test \
#        --debug
        # --jobs "4" \
}

time run_tests "$@"