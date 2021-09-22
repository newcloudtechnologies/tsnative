// Signals that the class this decorator applied to has hidden pointer to virtual functions table.
// This knowledge is used to add an extra element to struct body that represents class layout.
export function VTable<T>(_: T) { }

// Signals that the class member this decorator applied to has automatic storage memory type, that is, member type is a value type.
// This knowledge is used to add element with correct type to struct body that represents class layout.
// Without this decorator class member is considered of pointer or reference type.
export function ValueType<T>(_: T, __: string) { }
