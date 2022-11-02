#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

import argparse
import time
import json

import os
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--tag")

group = parser.add_mutually_exclusive_group()
group.add_argument("--start", action="store_true")
group.add_argument("--end", action="store_true")
group.add_argument("--calculate", action="store_true")

args = parser.parse_args()

MEASURES_FILEPATH = os.getenv(
    'TS_PROFILE_BUILD_OUTPUT', Path.home().joinpath("tsnative_profile_build.json"))

measures_file = Path(MEASURES_FILEPATH)
measures_file.touch(exist_ok=True)

if os.stat(MEASURES_FILEPATH).st_size == 0:
    measures = {}
    measures[args.tag] = {}
else:
    with open(MEASURES_FILEPATH, "r") as file:
        measures = json.load(file)

if args.calculate:
    for tag in measures:
        start = measures[tag]["start"]
        end = measures[tag]["end"]
        message = f'Step "{tag}" took {end - start} ms ({(end - start)/1000.0} s)'
        print(message)

else:
    if args.tag in measures:
        tagData = measures[args.tag]
    else:
        tagData = {}

    if args.start:
        tagData["start"] = int(time.time()*1000.0)

    if args.end:
        tagData["end"] = int(time.time()*1000.0)

    measures[args.tag] = tagData

    with open(MEASURES_FILEPATH, "w") as file:
        json.dump(measures, file)
