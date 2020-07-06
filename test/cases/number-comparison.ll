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
  call void @foo(%env__double___double_* %5, double 1.000000e+00, double 2.000000e+00)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @foo(%env__double___double_* %__environment__, double %a, double %b) {
entry:
  %0 = load %env__double___double_, %env__double___double_* %__environment__
  %1 = extractvalue %env__double___double_ %0, 0
  %.load = load double, double* %1
  %2 = load %env__double___double_, %env__double___double_* %__environment__
  %3 = extractvalue %env__double___double_ %2, 1
  %.load1 = load double, double* %3
  %4 = fcmp oeq double %.load, %.load1
  %5 = load %env__double___double_, %env__double___double_* %__environment__
  %6 = extractvalue %env__double___double_ %5, 0
  %.load2 = load double, double* %6
  %7 = load %env__double___double_, %env__double___double_* %__environment__
  %8 = extractvalue %env__double___double_ %7, 1
  %.load3 = load double, double* %8
  %9 = fcmp one double %.load2, %.load3
  %10 = load %env__double___double_, %env__double___double_* %__environment__
  %11 = extractvalue %env__double___double_ %10, 0
  %.load4 = load double, double* %11
  %12 = load %env__double___double_, %env__double___double_* %__environment__
  %13 = extractvalue %env__double___double_ %12, 1
  %.load5 = load double, double* %13
  %14 = fcmp olt double %.load4, %.load5
  %15 = load %env__double___double_, %env__double___double_* %__environment__
  %16 = extractvalue %env__double___double_ %15, 0
  %.load6 = load double, double* %16
  %17 = load %env__double___double_, %env__double___double_* %__environment__
  %18 = extractvalue %env__double___double_ %17, 1
  %.load7 = load double, double* %18
  %19 = fcmp ogt double %.load6, %.load7
  %20 = load %env__double___double_, %env__double___double_* %__environment__
  %21 = extractvalue %env__double___double_ %20, 0
  %.load8 = load double, double* %21
  %22 = load %env__double___double_, %env__double___double_* %__environment__
  %23 = extractvalue %env__double___double_ %22, 1
  %.load9 = load double, double* %23
  %24 = fcmp ole double %.load8, %.load9
  %25 = load %env__double___double_, %env__double___double_* %__environment__
  %26 = extractvalue %env__double___double_ %25, 0
  %.load10 = load double, double* %26
  %27 = load %env__double___double_, %env__double___double_* %__environment__
  %28 = extractvalue %env__double___double_ %27, 1
  %.load11 = load double, double* %28
  %29 = fcmp oge double %.load10, %.load11
  ret void
}
