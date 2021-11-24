# docreg.devos.club/typescript-environment:1.7

FROM docreg.devos.club/ubuntu-cmake:1.10

LABEL TSNative environment image

RUN apt-get update && apt-get install -y \
    sudo \
    wget \
    libz-dev \
    make \
    nodejs \
    npm \
    lsb-core \
    software-properties-common

RUN wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null

RUN apt-add-repository 'deb https://apt.kitware.com/ubuntu/ bionic main'

RUN apt update && apt install -y cmake

RUN add-apt-repository ppa:ubuntu-toolchain-r/test -y

RUN apt-get update && apt-get install -y \
    gcc-9 \
    g++-9

# llvm.sh installs 11.1.0 and we're not ready for it yet
# RUN mkdir llvm && cd /llvm && wget https://apt.llvm.org/llvm.sh
# RUN chmod +x /llvm/llvm.sh
# RUN /llvm/llvm.sh 11
# RUN rm -rf /llvm
RUN apt-get install -y llvm-11 libclang-11-dev

RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-9 60
RUN update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-9 60
RUN update-alternatives --install /usr/bin/llc llc /usr/lib/llvm-11/bin/llc 60

RUN npm i -g n

RUN n install 16.6.2

ENV PATH $PATH

CMD /bin/bash
