#!/usr/bin/env python3
#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

import argparse
import os

from datetime import date

parser = argparse.ArgumentParser(description="Just an example",
                                 formatter_class=argparse.ArgumentDefaultsHelpFormatter)

parser.add_argument("-O", "--outputFolder", required=True,
                    help="Output folder for index file")

parser.add_argument("-l", "--files", required=True,
                    help="List of index files")

parser.add_argument("-e", "--exported", required=True,
                    help="Export list")

parser.add_argument("-m", "--module", required=True,
                    help="Module name")

parser.add_argument("-n", "--no_head", required=False, default="false",
                    help="Disable head printing [true/false]")

args = parser.parse_args()
config = vars(args)

head = '''/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-%s
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */''' % date.today().year

full_path = os.path.join(config["outputFolder"], "index.ts")

with open(full_path, "w") as file:
    if config["no_head"] != "true":
        file.write("%s\n\n" % head)

    for it in config["files"].split(";"):
        file.write("/// <reference path=\"%s\" />\n" % it)

    file.write("\n")

    for it in config["exported"].split(";"):
        file.write("export { %s } from \"%s\"\n" % (it, config["module"]))
