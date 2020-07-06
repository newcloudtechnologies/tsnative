; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%env__double_ = type { double* }

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.000000e+00, double* %1
  %param = insertvalue %env__double_ zeroinitializer, double* %1, 0
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to %env__double_*
  store %env__double_ %param, %env__double_* %3
  %4 = call double @foo(%env__double_* %3, double 1.000000e+00)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define double @foo(%env__double_* %__environment__, double %param) {
entry:
  %0 = load %env__double_, %env__double_* %__environment__
  %1 = extractvalue %env__double_ %0, 0
  %.load = load double, double* %1
  %2 = load %env__double_, %env__double_* %__environment__
  %3 = extractvalue %env__double_ %2, 0
  %.load1 = load double, double* %3
  %localConst = fadd double %.load, %.load1
  %4 = load %env__double_, %env__double_* %__environment__
  %5 = extractvalue %env__double_ %4, 0
  %localParamAlias = load double, double* %5
  %6 = load %env__double_, %env__double_* %__environment__
  %7 = extractvalue %env__double_ %6, 0
  %.load3 = load double, double* %7
  %8 = fadd double %localConst, %.load3
  %9 = call i8* @_ZN2GC8allocateEj(i32 8)
  %10 = bitcast i8* %9 to double*
  store double %8, double* %10
  %localAllocaAlias = load double, double* %10
  store double %localConst, double* %10
  %11 = call i8* @_ZN2GC8allocateEj(i32 8)
  %12 = bitcast i8* %11 to double*
  store double %localAllocaAlias, double* %12
  %.load5 = load double, double* %10
  %13 = fadd double %localParamAlias, %.load5
  store double %13, double* %12
  %.load6 = load double, double* %12
  ret double %.load6
}
