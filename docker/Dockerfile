FROM ubuntu:18.04

LABEL TypeScript-LLVM environment image

RUN apt-get update && apt-get install -y \
    sudo \
    build-essential \
    wget \
    libz-dev \
    git \
    make \
    cmake \
    nodejs \
    npm \
    lsb-core \
    software-properties-common

RUN add-apt-repository ppa:ubuntu-toolchain-r/test -y

RUN apt-get update && apt-get install -y \
    gcc-9 \
    g++-9

RUN mkdir llvm && cd /llvm && wget https://apt.llvm.org/llvm.sh
RUN chmod +x /llvm/llvm.sh
RUN /llvm/llvm.sh 11
RUN rm -rf /llvm

RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-9 60
RUN update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-9 60
RUN update-alternatives --install /usr/bin/llc llc /usr/lib/llvm-11/bin/llc 60

RUN npm i -g n

RUN n install 13

ENV PATH $PATH

CMD /bin/bash
