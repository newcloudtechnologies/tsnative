## 🔹 О проекте
* Кроссплатформенный AOT транслятор языка TypeScript в нативный LLVM код
* Прямая интеграция с нативным С++-кодом
* Набор платформенных абстракций (GC, EventLoop, Runtime)
* Своя реализация ECMA
* Linux
* Целевая аудитория:
    - Web разработчики, мимикрия под web-DX (Developer eXperience)
    - C++ разработчики, желающие удешевить разработку бизнес логики

## 🧭 Цели
* Создать бесшовный (или с минимальным барьером) инструментарий для написания нативных приложений на TypeScript и C++ в одном приложении
* Дать возможность отладки для написанных приложений как со стороны TypeScript, так и со стороны C++
* Обеспечить работу решения на максимальном количестве платформ и устройств
* Поддержать TypeScript не ниже версии 4.5, ECMA не ниже 2016, С++ не ниже 14

## 📦 Зависимости
Устанавливаем необходимые пакеты:
```bash
apt-get update && apt-get upgrade -y && \
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
```

Устанавливаем python3.11
```bash
apt install -y software-properties-common && \
add-apt-repository ppa:deadsnakes/ppa && \
apt update && \
apt-get install -y \
python3.11

curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
```

Устанавливаем conan (используем python3.11 т.к. в 3.12 имеются проблемы с запуском conan 1 из-за несовместимости)
```bash
python3.11 -m pip install --upgrade pip setuptools wheel
python3.11 -m pip install conan==1.52 --ignore-installed
```

Устанавливаем Node.js 16.X.X
> [!NOTE]  
> Рекомендуется устанавливать через установщик с сайта [nodejs](https://nodejs.org/en/download/), т.к. начиная с Ubuntu 22.04, пакет Node.js 16-й версии недоступен через apt

## 🛠️ Сборка
Клонируем репозиторий
```bash
git clone --depth 1 --branch master git@github.com:newcloudtechnologies/tsnative.git
cd tsnative
```

Устанавливаем файлы с настройками и профилями для conan
```bash
conan config install ./settings.yml
conan config install -tf profiles ./profiles/linux_x86_64_gcc9
conan config install -tf profiles ./profiles/linux_x86_64_gcc9_debug
```

Cобираем 3rd party
```bash
conan create 3rdparty/zlib 1.2.12@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/llvm 11.1.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/abseil 20211102.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/gtest 1.11.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/libuv 1.43.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/graphvizlib 1.0.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/llvm-node 3.0.9@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
```

Cобираем основные цели
```bash
conan create declarator/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create std/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9 -o build_tests=True -o enable_logs=all
conan create compiler/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
```

## 🧪 Тесты
```bash
# -o runmode и -o test_filter - опциональны
conan create test/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9 -o run_mode=compile -o test_filter=for
```

## 📁 Пример
В репозитории находится тестовый проект [boilerplate](https://github.com/newcloudtechnologies/tsnative/tree/master/boilerplate). Он представляет собой каркас приложения, основанного на TypeScript Native.

Для запуска сборки вызываем команду:
```bash
npm run build
```
Собранный артефакт можно найти по пути `boilerplate/out/<cmake_project_name>`

## ⚠️ Ограничения
Краткий список ограничений доступен в [LIMITATIONS.md](./LIMITATIONS.md)
