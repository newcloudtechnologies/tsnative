; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%C__class = type {}
%"env__()" = type {}

define i32 @main() {
entry:
  %0 = call %C__class* @staticGetter()
  %1 = call i8* @_ZN2GC8allocateEj(i32 1)
  %2 = bitcast i8* %1 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %2
  call void @staticMethod(%"env__()"* %2)
  ret i32 0
}

define %C__class* @staticGetter() {
entry:
  %0 = call %C__class* @C__class__constructor()
  ret %C__class* %0
}

define %C__class* @C__class__constructor() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to %C__class*
  ret %C__class* %1
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @staticMethod(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  ret void
}
