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
  call void @bar(%"env__(_double*_double*)"* %7)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @bar(%"env__(_double*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*_double*)", %"env__(_double*_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*_double*)" %0, 1
  %2 = extractvalue %"env__(_double*_double*)" %0, 0
  %3 = extractvalue %"env__(_double*_double*)" %0, 0
  %4 = extractvalue %"env__(_double*_double*)" %0, 1
  %5 = insertvalue %"env__(_double*_double*)" zeroinitializer, double* %3, 0
  %6 = insertvalue %"env__(_double*_double*)" %5, double* %4, 1
  %7 = call i8* @_ZN2GC8allocateEj(i32 16)
  %8 = bitcast i8* %7 to %"env__(_double*_double*)"*
  store %"env__(_double*_double*)" %6, %"env__(_double*_double*)"* %8
  %9 = call double* @foo(%"env__(_double*_double*)"* %8)
  ret void
}

define double* @foo(%"env__(_double*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*_double*)", %"env__(_double*_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*_double*)" %0, 0
  %2 = extractvalue %"env__(_double*_double*)" %0, 1
  %3 = load double, double* %1
  %4 = load double, double* %2
  %5 = fadd double %3, %4
  %6 = call i8* @_ZN2GC8allocateEj(i32 8)
  %7 = bitcast i8* %6 to double*
  store double %5, double* %7
  ret double* %7
}
