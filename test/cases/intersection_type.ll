; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i64, i64, i64, i64 }

@0 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.000000e+00, double* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 32)
  %3 = bitcast i8* %2 to %string*
  %4 = call %string* @_ZN6stringC1EPKa(%string* %3, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %5 = call i8* @_ZN2GC8allocateEj(i32 8)
  %6 = bitcast i8* %5 to double*
  store double 0.000000e+00, double* %6
  %7 = call i8* @_ZN2GC8allocateEj(i32 24)
  %a.b.c = bitcast i8* %7 to { double*, %string*, double* }*
  %a = getelementptr inbounds { double*, %string*, double* }, { double*, %string*, double* }* %a.b.c, i32 0, i32 0
  store double* %1, double** %a
  %b = getelementptr inbounds { double*, %string*, double* }, { double*, %string*, double* }* %a.b.c, i32 0, i32 1
  store %string* %3, %string** %b
  %c = getelementptr inbounds { double*, %string*, double* }, { double*, %string*, double* }* %a.b.c, i32 0, i32 2
  store double* %6, double** %c
  %a1 = getelementptr inbounds { double*, %string*, double* }, { double*, %string*, double* }* %a.b.c, i32 0, i32 0
  %8 = load double*, double** %a1
  %9 = load double, double* %8
  call void @_ZN7console3logIdEEvT_(double %9)
  %b2 = getelementptr inbounds { double*, %string*, double* }, { double*, %string*, double* }* %a.b.c, i32 0, i32 1
  %10 = load %string*, %string** %b2
  call void @_ZN7console3logIRK6stringEEvT_(%string* %10)
  %c3 = getelementptr inbounds { double*, %string*, double* }, { double*, %string*, double* }* %a.b.c, i32 0, i32 2
  %11 = load double*, double** %c3
  %12 = load double, double* %11
  call void @_ZN7console3logIdEEvT_(double %12)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare void @_ZN7console3logIdEEvT_(double)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)
