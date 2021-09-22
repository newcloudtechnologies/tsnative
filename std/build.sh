#!/bin/sh

mkdir -p $(dirname "$0")/lib && cd $(dirname "$0")/lib && cmake -G "Unix Makefiles" .. && make;
