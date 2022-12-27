#include "object_wrappers.h"

#include "std/private/tsarray_std_p.h"

#include <initializer_list>

namespace test
{
class ObjectFactory
{
public:
    template <typename T>
    static Array<T> createArray(std::initializer_list<T> list)
    {
        Array<T> result;
        for (auto e : list)
        {
            result.push(e);
        }

        return result;
    }

    template <typename T>
    static DequeueBackend<T> createDequeBackend(std::initializer_list<T> list)
    {
        DequeueBackend<T> result;
        for (auto e : list)
        {
            result.push(e);
        }

        return result;
    }

    template <typename T>
    static DequeueBackend<T> createDequeBackend(const std::vector<T>& elements)
    {
        DequeueBackend<T> result;
        for (auto& e : elements)
        {
            result.push(e);
        }

        return result;
    }
};
} // namespace test