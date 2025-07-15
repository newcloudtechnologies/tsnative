#pragma once

#include <unordered_set>

class Object;

// TODO Use absl::uset ?

using Roots = std::unordered_set<Object**>;
using UniqueObjects = std::unordered_set<Object*>;
using UniqueConstObjects = std::unordered_set<const Object*>;
