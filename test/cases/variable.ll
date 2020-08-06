; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__(_double*)" = type { double* }

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.000000e+00, double* %1
  %2 = insertvalue %"env__(_double*)" zeroinitializer, double* %1, 0
  %3 = call i8* @_ZN2GC8allocateEj(i32 8)
  %4 = bitcast i8* %3 to %"env__(_double*)"*
  store %"env__(_double*)" %2, %"env__(_double*)"* %4
  %5 = call double* @foo(%"env__(_double*)"* %4)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define double* @foo(%"env__(_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*)", %"env__(_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*)" %0, 0
  %2 = extractvalue %"env__(_double*)" %0, 0
  %3 = load double, double* %1
  %4 = load double, double* %2
  %5 = fadd double %3, %4
  %6 = call i8* @_ZN2GC8allocateEj(i32 8)
  %localConst = bitcast i8* %6 to double*
  store double %5, double* %localConst
  %localParamAlias = extractvalue %"env__(_double*)" %0, 0
  %7 = extractvalue %"env__(_double*)" %0, 0
  %8 = load double, double* %localConst
  %9 = load double, double* %7
  %10 = fadd double %8, %9
  %11 = call i8* @_ZN2GC8allocateEj(i32 8)
  %localAllocaAlias = bitcast i8* %11 to double*
  store double %10, double* %localAllocaAlias
  %12 = load double, double* %localConst
  store double %12, double* %localAllocaAlias
  %13 = load double, double* %localParamAlias
  %14 = load double, double* %localAllocaAlias
  %15 = fadd double %13, %14
  %16 = call i8* @_ZN2GC8allocateEj(i32 8)
  %17 = bitcast i8* %16 to double*
  store double %15, double* %17
  %18 = load double, double* %17
  store double %18, double* %localAllocaAlias
  ret double* %localAllocaAlias
}
