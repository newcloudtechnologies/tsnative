; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to i1*
  store i1 false, i1* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 1)
  %3 = bitcast i8* %2 to i1*
  store i1 true, i1* %3
  %4 = load i1, i1* %1
  store i1 %4, i1* %3
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)
