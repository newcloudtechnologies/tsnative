; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__(_double*_double*)" = type { double*, double* }

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.000000e+00, double* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to double*
  store double 2.000000e+00, double* %3
  %4 = insertvalue %"env__(_double*_double*)" zeroinitializer, double* %1, 0
  %5 = insertvalue %"env__(_double*_double*)" %4, double* %3, 1
  %6 = call i8* @_ZN2GC8allocateEj(i32 16)
  %7 = bitcast i8* %6 to %"env__(_double*_double*)"*
  store %"env__(_double*_double*)" %5, %"env__(_double*_double*)"* %7
  call void @foo(%"env__(_double*_double*)"* %7)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @foo(%"env__(_double*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*_double*)", %"env__(_double*_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*_double*)" %0, 0
  %2 = extractvalue %"env__(_double*_double*)" %0, 1
  %3 = load double, double* %1
  %4 = load double, double* %2
  %5 = fcmp oeq double %3, %4
  %6 = extractvalue %"env__(_double*_double*)" %0, 0
  %7 = load double, double* %6
  %8 = extractvalue %"env__(_double*_double*)" %0, 1
  %9 = load double, double* %8
  %10 = fcmp one double %7, %9
  %11 = extractvalue %"env__(_double*_double*)" %0, 0
  %12 = load double, double* %11
  %13 = extractvalue %"env__(_double*_double*)" %0, 1
  %14 = load double, double* %13
  %15 = fcmp olt double %12, %14
  %16 = extractvalue %"env__(_double*_double*)" %0, 0
  %17 = load double, double* %16
  %18 = extractvalue %"env__(_double*_double*)" %0, 1
  %19 = load double, double* %18
  %20 = fcmp ogt double %17, %19
  %21 = extractvalue %"env__(_double*_double*)" %0, 0
  %22 = load double, double* %21
  %23 = extractvalue %"env__(_double*_double*)" %0, 1
  %24 = load double, double* %23
  %25 = fcmp ole double %22, %24
  %26 = extractvalue %"env__(_double*_double*)" %0, 0
  %27 = load double, double* %26
  %28 = extractvalue %"env__(_double*_double*)" %0, 1
  %29 = load double, double* %28
  %30 = fcmp oge double %27, %29
  ret void
}
