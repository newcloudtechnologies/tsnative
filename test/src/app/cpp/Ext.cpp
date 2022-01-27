/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "Ext.h"
#include <std/gc.h>

#include <iostream>

namespace cpp::ts
{

Ext::Ext()
{
    std::cout << "Ext ctor" << std::endl;
}

void Ext::dummy() const
{
    std::cout << "Oh weee dummy me" << std::endl;
}

// const string* Ext::getText() const
// {
//     auto str = cast<impl_t>(impl_)->getText().toStdString();
//     return GC::createHeapAllocated<string>(str);
// }

// void Ext::setText(const string& text)
// {
//     // cast<impl_t>(impl_)->setText(text.cpp_str());
// }

} // namespace cpp::ts