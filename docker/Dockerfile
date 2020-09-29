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

RUN mkdir llvm && cd /llvm && wget https://apt.llvm.org/llvm.sh
RUN chmod +x /llvm/llvm.sh
RUN /llvm/llvm.sh 9
RUN rm -rf /llvm

RUN update-alternatives --install /usr/bin/llc llc /usr/lib/llvm-9/bin/llc 60

RUN npm i -g npm@latest

RUN npm i -g n

RUN n latest

ENV PATH $PATH

CMD /bin/bash
