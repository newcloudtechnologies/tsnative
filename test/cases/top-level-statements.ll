; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%env__double_ = type { double* }

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %a = bitcast i8* %0 to double*
  store double 4.000000e+00, double* %a
  %.load = load double, double* %a
  %1 = fadd double %.load, 1.000000e+00
  store double %1, double* %a
  %a1 = insertvalue %env__double_ zeroinitializer, double* %a, 0
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to %env__double_*
  store %env__double_ %a1, %env__double_* %3
  call void @foo(%env__double_* %3)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @foo(%env__double_* %__environment__) {
entry:
  ret void
}
