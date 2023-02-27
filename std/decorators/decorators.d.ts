/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */
// Signals that the class this decorator applied to has hidden pointer to virtual functions table.
// This knowledge is used to add an extra element to struct body that represents class layout.
export function VTable<T>(_: T): any;

// Signals that the class this decorator applied to has vtable struct initializer (aka 'vtable for <ClassName>') of size _N.
export function VTableSize(_N: number): any;

// Signals that the class this decorator applied to has virtual destructor
export function VirtualDestructor<T>(_: T): any

// Signals that the class method this decorator applied to is virtual on C++ side and may be overridden. Appliable only to C++ class declarations!
export function Virtual(): any;

// Signals that the class method this decorator applied to is overrides some virtual C++ function of the one of the base classes.
export function Override(): any;