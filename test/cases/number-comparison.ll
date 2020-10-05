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
  %10 = fcmp oeq double %7, %9
  %11 = xor i1 %10, true
  %12 = extractvalue %"env__(_double*_double*)" %0, 0
  %13 = load double, double* %12
  %14 = extractvalue %"env__(_double*_double*)" %0, 1
  %15 = load double, double* %14
  %16 = fcmp olt double %13, %15
  %17 = extractvalue %"env__(_double*_double*)" %0, 0
  %18 = load double, double* %17
  %19 = extractvalue %"env__(_double*_double*)" %0, 1
  %20 = load double, double* %19
  %21 = fcmp ogt double %18, %20
  %22 = extractvalue %"env__(_double*_double*)" %0, 0
  %23 = load double, double* %22
  %24 = extractvalue %"env__(_double*_double*)" %0, 1
  %25 = load double, double* %24
  %26 = fcmp ole double %23, %25
  %27 = extractvalue %"env__(_double*_double*)" %0, 0
  %28 = load double, double* %27
  %29 = extractvalue %"env__(_double*_double*)" %0, 1
  %30 = load double, double* %29
  %31 = fcmp oge double %28, %30
  ret void
}
