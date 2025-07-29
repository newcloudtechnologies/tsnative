## 🔹 О проекте
**tsnative** — это кроссплатформенный AOT-компилятор, позволяющий запускать TypeScript как нативный код через LLVM.  
Проект ориентирован на разработчиков, которым важно сочетать **удобство TypeScript** с **производительностью C++**.

Основные особенности:
- **Интеграция с C++** — seamless вызовы между TS и C++ без glue-кода
- **Набор системных абстракций** — GC, EventLoop, runtime API
- **Собственная реализация подмножества ECMAScript**
- **AOT-компиляция через LLVM** — без интерпретатора и JS-движка
- Поддержка: **Linux**

Целевая аудитория:
- Web-разработчики, желающие использовать TS вне браузера
- C++-разработчики, которым нужно ускорить разработку бизнес-логики без потери производительности

## 🎯 Цели
- Обеспечить **бесшовную интеграцию** TypeScript и C++ в одном приложении
- Дать возможность **двусторонней отладки**: как TS, так и C++ кода
- Поддержать **максимум платформ**
- Совместимость с:
  - TypeScript ≥ 4.5
  - ECMAScript ≥ 2016
  - C++ ≥ 14

## 🚀 Быстрый старт
Используйте готовый Docker-образ с установленными зависимостями и уже собранным проектом:
```bash
# скачиваем образ
docker pull ghcr.io/newcloudtechnologies/tsnative:latest
# запускаем
docker run -it ghcr.io/newcloudtechnologies/tsnative
# собираем пример
cd boilerplate/
npm run build
```
Вы также можете собрать образ локально из исходников:
```bash
docker build -t tsnative .
docker run -it tsnative
```

## 📦 Зависимости
Клонируем репозиторий:
```bash
git clone --depth 1 --branch master git@github.com:newcloudtechnologies/tsnative.git
cd tsnative
```

Выполните:
```bash
./scripts/setup.sh
```

Устанавливаем файлы с настройками и профилями для conan:
```bash
conan config install ./settings.yml
conan config install -tf profiles ./profiles/linux_x86_64_gcc9
conan config install -tf profiles ./profiles/linux_x86_64_gcc9_debug
```

## 🛠️ Сборка
Cобираем 3rd party:
```bash
conan create 3rdparty/zlib 1.2.12@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/llvm 11.1.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/abseil 20211102.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/gtest 1.11.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/libuv 1.43.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/graphvizlib 1.0.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/llvm-node 3.0.9@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
```

Cобираем основные цели:
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
В репозитории находится тестовый проект [`boilerplate`](./boilerplate), демонстрирующий работу TypeScript Native.

Основные команды:
```bash
npm run build    # сборка
npm run clean    # очистка артефактов
npm run rebuild  # пересборка
```
Собранный бинарный файл будет в директории: `boilerplate/out/<cmake_project_name>`

## ⚠️ Ограничения
Проект реализует подмножество возможностей TypeScript и имеет ряд ограничений при интеграции с C++.
Краткий список ограничений доступен в [LIMITATIONS.md](./LIMITATIONS.md)

## 🤝 Контрибуция
Мы рады любым улучшениям — будь то код, тесты, документация или идеи.  
Перед отправкой изменений ознакомьтесь с [CONTRIBUTING.md](./CONTRIBUTING.md).
