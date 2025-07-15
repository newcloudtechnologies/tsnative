#!/usr/bin/env python3

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

args = parser.parse_args()
config = vars(args)

full_path = os.path.join(config["outputFolder"], "index.ts")

with open(full_path, "w") as file:
    for it in config["files"].split(";"):
        file.write("/// <reference path=\"%s\" />\n" % it)

    file.write("\n")

    for it in config["exported"].split(";"):
        file.write("export { %s } from \"%s\"\n" % (it, config["module"]))
