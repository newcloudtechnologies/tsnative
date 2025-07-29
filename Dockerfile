# Use official Ubuntu base image
FROM ubuntu:latest

LABEL maintainer="tsnative docker maintainer"
LABEL description="Image for building and testing the tsnative C++ library"

# Setting up the environment
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y \
    git \
    curl \
    cmake \
    build-essential \
    ccache \
    pkg-config \
    binutils-dev \
    zlib1g-dev \
    libxkbcommon-dev \
    libxkbcommon-x11-dev \
    libiberty-dev \
    libxfixes-dev \
    gcc-9 \
    g++-9

RUN apt install -y software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt update && \
    apt-get install -y \
    python3.11 

RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
RUN python3.11 -m pip install --upgrade pip setuptools wheel
RUN python3.11 -m pip install conan==1.52 --ignore-installed

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

# Clone the repository
WORKDIR /project

RUN git clone --depth 1 --branch master git@github.com:newcloudtechnologies/tsnative.git

# Set up the settings and profiles for conan
RUN conan config install tsnative/settings.yml
RUN conan config install -tf profiles tsnative/profiles/linux_x86_64_gcc9
RUN conan config install -tf profiles tsnative/profiles/linux_x86_64_gcc9_debug

# Build 3rdparty
RUN conan create tsnative/3rdparty/zlib 1.2.12@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
RUN conan create tsnative/3rdparty/llvm 11.1.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
RUN conan create tsnative/3rdparty/abseil 20211102.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
RUN conan create tsnative/3rdparty/gtest 1.11.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
RUN conan create tsnative/3rdparty/libuv 1.43.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
RUN conan create tsnative/3rdparty/graphvizlib 1.0.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
RUN conan create tsnative/3rdparty/llvm-node 3.0.9@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9

# Build targets
RUN conan create tsnative/declarator/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
RUN conan create tsnative/std/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9 -o build_tests=True -o enable_logs=all
RUN conan create tsnative/compiler/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9

# Specify the default command
CMD [ "bash" ]
