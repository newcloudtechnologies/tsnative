; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__()" = type {}

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %1
  call void @foo(%"env__()"* %1)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @foo(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %1 = call i8* @_ZN2GC8allocateEj(i32 8)
  %b = bitcast i8* %1 to double*
  store double 2.000000e+00, double* %b
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to double*
  store double 1.000000e+00, double* %3
  %4 = call i8* @_ZN2GC8allocateEj(i32 16)
  %a2 = bitcast i8* %4 to { double*, double* }*
  %a = getelementptr inbounds { double*, double* }, { double*, double* }* %a2, i32 0, i32 0
  store double* %3, double** %a
  %b1 = getelementptr inbounds { double*, double* }, { double*, double* }* %a2, i32 0, i32 1
  store double* %b, double** %b1
  %a3 = getelementptr inbounds { double*, double* }, { double*, double* }* %a2, i32 0, i32 0
  %b4 = getelementptr inbounds { double*, double* }, { double*, double* }* %a2, i32 0, i32 1
  %5 = load double*, double** %b4
  store double* %5, double** %a3
  ret void
}
