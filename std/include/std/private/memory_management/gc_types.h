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

#pragma once

#include <unordered_set>

class Object;

// TODO Use absl::uset ?

using Roots = std::unordered_set<Object**>;
using UniqueObjects = std::unordered_set<Object*>;
using UniqueConstObjects = std::unordered_set<const Object*>;
