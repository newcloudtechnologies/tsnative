# ⚠️ Limitations

## TypeScript Native

- **No `eval` or dynamic object modification**  
  Code is strictly compiled; object structures must be static and known at compile time.
- **Strict mode only (`strict`)**  
  Enforced type safety — usage of `any` and `unknown` is disallowed.
- **Tuple and array constraints**  
  Only homogeneous arrays and statically indexed tuples are supported.
- **Partial JS feature support**  
  Features like `Function.bind` with generics or `for..of` over tuples are not supported.

See also: [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## C++ Integration

- **No exception passing between C++ and TypeScript**
- **TypeScript objects are not thread-safe**  
  Do not pass them into other threads.
- **Pointer-based API and inheritance from `Object` required**  
  All exported arguments and return types must be pointers to classes with `Object` as the first base class.
- **Function overloading is not supported for exports**
- **Stack objects cannot be captured or passed to TS**  
  Use `make_closure` and allocate objects on the heap.
