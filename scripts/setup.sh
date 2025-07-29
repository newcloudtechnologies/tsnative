#!/usr/bin/env bash
set -e

echo "📦 Updating packages..."
sudo apt-get update && apt-get upgrade -y && \
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

echo "📦 Installing python"
sudo apt install -y software-properties-common && \
add-apt-repository ppa:deadsnakes/ppa && \
apt update && \
apt-get install -y \
python3.11

curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

echo "📦 Installing Node.js 16.x..."
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

echo "🐍 Installing Conan 1.52 for Python 3.11..."
python3.11 -m pip install --upgrade pip setuptools wheel
python3.11 -m pip install conan==1.52 --ignore-installed

echo "✅ Done...'"
