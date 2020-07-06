; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%env__double___double_ = type { double*, double* }

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.000000e+00, double* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to double*
  store double 2.000000e+00, double* %3
  %a = insertvalue %env__double___double_ zeroinitializer, double* %1, 0
  %b = insertvalue %env__double___double_ %a, double* %3, 1
  %4 = call i8* @_ZN2GC8allocateEj(i32 16)
  %5 = bitcast i8* %4 to %env__double___double_*
  store %env__double___double_ %b, %env__double___double_* %5
  call void @bar(%env__double___double_* %5, double 1.000000e+00, double 2.000000e+00)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @bar(%env__double___double_* %__environment__, double %a, double %b) {
entry:
  %0 = load %env__double___double_, %env__double___double_* %__environment__
  %1 = extractvalue %env__double___double_ %0, 1
  %.load = load double, double* %1
  %2 = load %env__double___double_, %env__double___double_* %__environment__
  %3 = extractvalue %env__double___double_ %2, 0
  %.load1 = load double, double* %3
  %4 = call i8* @_ZN2GC8allocateEj(i32 8)
  %5 = bitcast i8* %4 to double*
  store double %.load, double* %5
  %6 = call i8* @_ZN2GC8allocateEj(i32 8)
  %7 = bitcast i8* %6 to double*
  store double %.load1, double* %7
  %a2 = insertvalue %env__double___double_ zeroinitializer, double* %5, 0
  %b3 = insertvalue %env__double___double_ %a2, double* %7, 1
  %8 = call i8* @_ZN2GC8allocateEj(i32 16)
  %9 = bitcast i8* %8 to %env__double___double_*
  store %env__double___double_ %b3, %env__double___double_* %9
  %10 = call double @foo(%env__double___double_* %9, double %.load, double %.load1)
  ret void
}

define double @foo(%env__double___double_* %__environment__, double %a, double %b) {
entry:
  %0 = load %env__double___double_, %env__double___double_* %__environment__
  %1 = extractvalue %env__double___double_ %0, 0
  %.load = load double, double* %1
  %2 = load %env__double___double_, %env__double___double_* %__environment__
  %3 = extractvalue %env__double___double_ %2, 1
  %.load1 = load double, double* %3
  %4 = fadd double %.load, %.load1
  ret double %4
}
