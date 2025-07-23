## О проекте ##
* Кроссплатформенный AOT транслятор языка Typescript в нативный LLVM код
* Прямая интеграция с нативным С++-кодом
* Набор платформенных абстракций (GC, EventLoop, Runtime)
* Своя реализация ECMA
* Linux, Windows, Android, Mac OS
* Целевая аудитория:
    - Web-разработчики, мимикрия под web-DX (Developer eXperience)
    - C++ разработчики, желающие удешевить разработку бизнес логики

## Цели ## 
* Создать бесшовный (или с минимальным барьером) инструментарий для написания нативных приложений на TS и C++ в одном приложении
* Дать возможность отладки для написанных приложения как со стороны TS, так и со стороны C++
* Обеспечить работу решения на максимальном количестве платформ и устройств
* Поддержать TS не ниже версии 4.5, ECMA не ниже 2016, С++ не ниже 14

## Настройка окружения ##
Устанавливаем необходимые пакеты:
```bash
sudo apt install -y \
git \
cmake \
build-essential \
ccache \
pkg-config \
binutils-dev \
zlib1g-dev \
libxcb-icccm4-dev \
libxcb-image0-dev \
libxcb-randr0-dev \
libxcb-sync-dev \
libxcb-xfixes0-dev \
libx11-xcb-dev \
libxkbcommon-dev \
libxkbcommon-x11-dev \
libgl1-mesa-dev \
libfontconfig1-dev \
libiberty-dev \
libxfixes-dev \
gcc-9
```

Устанавливаем conan (используем python3.11 т.к. в 3.12 имеются проблемы с запуском conan 1 из-за несовместимости)
```bash
python3.11 -m pip install wheel
python3.11 -m pip install conan==1.52
```

Устанавливаем Node.js 16.X.X
> [!NOTE]  
> Рекомендуется устанавливать через установщик с сайта [nodejs](https://nodejs.org/en/download/), т.к. начиная с Ubuntu 22.04 пакет nodejs 16-й версии недоступен через apt

## Инструкция по сборке ##
Клонируем репозиторий
```bash
git clone git@github.com:newcloudtechnologies/tsnative.git
cd tsnative
```

Устанавливаем файлы с настройками и профилями для conan
```bash
conan config install ./settings.yml
conan config install -tf profiles ./profiles/linux_x86_64_gcc9
conan config install -tf profiles ./profiles/linux_x86_64_gcc9_debug
```

Cобираем 3rdparty
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

## Запуск тестов ##
```bash
# -o runmode и -o test_filter - опциональны
conan create test/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9 -o run_mode=compile -o test_filter=for
```

## Пример использования ##
В репозитории находится тестовый проект [бойлерплейт](https://github.com/newcloudtechnologies/tsnative/tree/master/boilerplate). Он представляет собой каркас приложения, основанного на TypeScript Native. 

Для запуска сборки вызываем команду:
```bash
npm run build
```
Собранный артефакт можно найти по пути 'boilerplate/out/<cmake_project_name>'

Очистка проекта производится командой:
```bash
npm run clean
```

Пересборка проекта производится командой:
```bash
npm run rebuild
```

## Ограничения ##
### TypeScript Native
* eval
    - ts-код не интерпретируется, что делает невозможным исполнение кода из произвольной строки
* Динамические свойства
    - Добавление и удаление свойств объектов во время исполнения невозможно, объекты должны иметь фиксированную структуру для корректного выделения памяти
    - Рекомендуется использовать интерфейсы вместо "сырых" объектов.
* Строгий режим форсируется компилятором
    - Без использования строгого режима null и undefined являются допустимыми значениями для любого типа. Форсирование данного режима позволяет обеспечить null-safety
* Не допускается использование any и unknown
    - Компилятор не поддерживает динамические типы. Исключением являются ts-декларации С++-классов (корректная перегрузка определяется в момент вызова) и декларации типов
* Function.bind не поддерживает обобщённые функции
    - Для получения связанных функций рекомендуется по возможности использовать стрелочные функции
* Массивы не могут иметь элементы различных типов
    - Исключение - элементы, имеющие общий базовый тип
* Кортежи
    - Полностью поддерживаются только константное индексирование. Индексы времени исполнения возвращают значение типа объединения всех элементов кортежа, операции над которыми не поддерживаются. По этой же причине не поддерживается for..of для кортежей

### TypeScript
https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html

### Код C++ используемый совместно с TypeScript
* Нельзя пробросить исключения из C++ кода в TS и обратно
* Нельзя использовать TypeScript объекты из других потоков. Например, нельзя передавать TSObjectOwner в другой поток
* Не работает передача объекта из TypeScript в функцию на C++
* Не нужно создавать стековые объекты и передавать их на сторону tsnative std
* Будьте аккуратны со static. Особенно если они держат другие объекты, например static Union*, под которым сидит Object. Время удаления статиков - UB
* Перегрузка экспортируемого метода\ф-ции не работает. Даже, если перегружаемая ф-ция не экспортируется
* Не кладите стековые объекты в замыкания! Пользуйтесь make_closure для этого
```c++
auto* n = new Number();
 
...
setEnvironmentElement(closure, &n);
...
```

### Код C++ используемый совместно с декларатором
1. Класс должен наследовать Object
```c++
// Класс Object есть в списке наследования
class TS_EXPORT Entity : public Object
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};
```
2. Унаследованный Object классом должен стоять первым в списке наследования
```c++
// Класс Object наследуется первым
class TS_EXPORT Entity : public Object, public Widget
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};
```
3. Аргументы методов и функций, возвращаемые значения должны быть указателями
```c++
// Аргументы и возвращаемое значение - указатели
TS_EXPORT Number* getNumber(Number* n);
```
4. Типы аргументов методов и функций, возвращаемых значений должны соответствовать пунктам 1 и 2
```c++
// Аргументы и возвращаемые значения - указатели, тип унаследован от Object, класс Object стоит первым в списке наследования
class TS_EXPORT Entity : public Object
{
public:
Entity() = default;
~Entity() = default;
TS_METHOD void entity();
};
 
TS_EXPORT Entity* getEntity(Entity* e);
```
