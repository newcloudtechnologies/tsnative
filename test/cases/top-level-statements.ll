; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__()" = type {}

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 4.000000e+00, double* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to double*
  store double 1.000000e+00, double* %3
  %4 = load double, double* %1
  %5 = load double, double* %3
  %6 = fadd double %4, %5
  %7 = call i8* @_ZN2GC8allocateEj(i32 8)
  %8 = bitcast i8* %7 to double*
  store double %6, double* %8
  %9 = load double, double* %8
  store double %9, double* %1
  %10 = call i8* @_ZN2GC8allocateEj(i32 1)
  %11 = bitcast i8* %10 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %11
  call void @foo(%"env__()"* %11)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @foo(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  ret void
}
