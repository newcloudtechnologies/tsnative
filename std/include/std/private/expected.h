#pragma once
#include <stdexcept>
#include <utility>

template <typename T, typename E>
class Expected final
{
public:
   using ValueType = T;
   using ErrorType = E;

protected:
   union
   {
       T mValue;
       E mError;
   };
   bool mIsValid{};
   Expected()
   {
   }

public:
   ~Expected();

   Expected(const Expected& other);

   Expected(Expected&& other) noexcept;

   Expected& operator=(Expected other);

   void swap(Expected& other) noexcept;

   template <typename... Args>
   static Expected makeValue(Args&&... args);

   template <typename... Args>
   static Expected makeError(Args&&... args);

   explicit operator bool() const;

   bool isValid() const;

   T& get();

   const T& get() const;

   T* get_if() noexcept;

   const T* get_if() const noexcept;

   T* operator->();

   const T* operator->() const;

   E& error();

   const E& error() const;

   T& operator*();

   const T& operator*() const;

   template <typename F>
   void visit(F f);
};
template <typename E>
class Expected<void, E> final
{
private:
   union
   {
       void* mValue{};
       E mError;
   };
   bool mIsValid{};
   Expected()
   {
   }

public:
   ~Expected();

   Expected(const Expected& other);

   Expected(Expected&& other) noexcept;

   Expected& operator=(Expected other);

   void swap(Expected& other) noexcept;

   static Expected makeValue();

   template <typename... Args>

   static Expected makeError(Args&&... args);

   explicit operator bool() const;

   bool isValid() const;

   E& error();

   const E& error() const;
};
// ====================== Expected<T, E> ===============================================
//
template <typename T, typename E>
Expected<T, E>::~Expected()
{
   if (mIsValid)
   {
       mValue.~T();
   }
   else
   {
       mError.~E();
   }
}

template <typename T, typename E>
Expected<T, E>::Expected(const Expected& other)
   : mIsValid{other.mIsValid}
{
   if (mIsValid)
   {
       new (&mValue) T{other.mValue};
   }
   else
   {
       new (&mError) E{other.mError};
   }
}

template <typename T, typename E>
Expected<T, E>::Expected(Expected&& other) noexcept
   : mIsValid{other.mIsValid}
{
   if (mIsValid)
   {
       new (&mValue) T{std::move(other.mValue)};
   }
   else
   {
       new (&mError) E{std::move(other.mError)};
   }
}

template <typename T, typename E>
Expected<T, E>& Expected<T, E>::operator=(Expected other)
{
   swap(other);
   return *this;
}

template <typename T, typename E>
void Expected<T, E>::swap(Expected& other) noexcept
{
   using std::swap;
   if (mIsValid)
   {
       if (other.mIsValid)
       {
           swap(mValue, other.mValue);
       }
       else
       {
           auto temp = std::move(other.mError);
           other.mError.~E();
           new (&other.mValue) T{std::move(mValue)};
           mValue.~T();
           new (&mError) E{std::move(temp)};
           std::swap(mIsValid, other.mIsValid);
       }
   }
   else
   {
       if (other.mIsValid)
       {
           other.swap(*this);
       }
       else
       {
           swap(mError, other.mError);
           std::swap(mIsValid, other.mIsValid);
       }
   }
}

template <typename T, typename E>
template <typename... Args>
Expected<T, E> Expected<T, E>::makeValue(Args&&... args)
{
   Expected result;
   result.mIsValid = true;
   new (&result.mValue) T{std::forward<Args>(args)...};
   return result;
}

template <typename T, typename E>
template <typename... Args>
Expected<T, E> Expected<T, E>::makeError(Args&&... args)
{
   Expected result;
   result.mIsValid = false;
   new (&result.mError) E{std::forward<Args>(args)...};
   return result;
}

template <typename T, typename E>
Expected<T, E>::operator bool() const
{
   return mIsValid;
}

template <typename T, typename E>
bool Expected<T, E>::isValid() const
{
   return mIsValid;
}

template <typename T, typename E>
T& Expected<T, E>::get()
{
   if (!mIsValid)
   {
       throw std::logic_error("Expected<T, E> contains no value. Missing value");
   }
   return mValue;
}

template <typename T, typename E>
const T& Expected<T, E>::get() const
{
   if (!mIsValid)
   {
       throw std::logic_error("Expected<T, E> contains no value. Missing value");
   }
   return mValue;
}

template <typename T, typename E>
T* Expected<T, E>::operator->()
{
   return &get();
}

template <typename T, typename E>
const T* Expected<T, E>::operator->() const
{
   return &get();
}

template <typename T, typename E>
E& Expected<T, E>::error()
{
   if (mIsValid)
   {
       throw std::logic_error("There is no error in this Expected<T, E>");
   }
   return mError;
}

template <typename T, typename E>
const E& Expected<T, E>::error() const
{
   if (mIsValid)
   {
       throw std::logic_error("There is no error in this Expected<T, E>");
   }
   return mError;
}

template <typename T, typename E>
template <typename F>
void Expected<T, E>::visit(F f)
{
   f(mIsValid ? mValue : mError);
}

template <typename T, typename E>
T& Expected<T, E>::operator*()
{
   return get();
}

template <typename T, typename E>
const T& Expected<T, E>::operator*() const
{
   return get();
}

template <typename T, typename E>
T* Expected<T, E>::get_if() noexcept
{
   if (!mIsValid)
   {
       return nullptr;
   }
   return &mValue;
}

template <typename T, typename E>
const T* Expected<T, E>::get_if() const noexcept
{
   if (!mIsValid)
   {
       return nullptr;
   }
   return &mValue;
}
//
// ====================== end Expected<T, E> ============================================
// ====================== Expected<void, E> =============================================
//
template <typename E>
Expected<void, E>& Expected<void, E>::operator=(Expected other)
{
   swap(other);
   return *this;
}

template <typename E>
void Expected<void, E>::swap(Expected& other) noexcept
{
   using std::swap;
   if (mIsValid)
   {
       if (!other.mIsValid)
       {
           auto temp = std::move(other.mError);
           other.mError.~E();
           new (&mError) E(std::move(temp));
           std::swap(mIsValid, other.mIsValid);
       }
   }
   else
   {
       if (other.mIsValid)
       {
           other.swap(*this);
       }
       else
       {
           swap(mError, other.mError);
           std::swap(mIsValid, other.mIsValid);
       }
   }
}

template <typename E>
Expected<void, E> Expected<void, E>::makeValue()
{
   Expected result;
   result.mIsValid = true;
   result.mValue = nullptr;
   return result;
}

template <typename E>
Expected<void, E>::Expected(Expected&& other) noexcept
   : mIsValid(other.mIsValid)
{
   if (!mIsValid)
   {
       new (&mError) E(std::move(other.mError));
   }
}

template <typename E>
Expected<void, E>::Expected(const Expected& other)
   : mIsValid(other.mIsValid)
{
   if (!mIsValid)
   {
       new (&mError) E(other.mError);
   }
}

template <typename E>
template <typename... Args>
Expected<void, E> Expected<void, E>::makeError(Args&&... args)
{
   Expected result;
   result.mIsValid = false;
   new (&result.mError) E{std::forward<Args>(args)...};
   return result;
}

template <typename E>
Expected<void, E>::operator bool() const
{
   return mIsValid;
}

template <typename E>
bool Expected<void, E>::isValid() const
{
   return mIsValid;
}

template <typename E>
Expected<void, E>::~Expected()
{
   if (!mIsValid)
   {
       mError.~E();
   }
}

template <typename E>
E& Expected<void, E>::error()
{
   if (mIsValid)
       throw std::logic_error("There is no error in this Expected<void, E>");
   return mError;
}

template <typename E>
const E& Expected<void, E>::error() const
{
   if (mIsValid)
       throw std::logic_error("There is no error in this Expected<void, E>");
   return mError;
}
// ====================== end Expected<void, E> ============================================

