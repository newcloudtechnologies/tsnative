; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i64, i64, i64, i64 }

@0 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 24)
  %1 = bitcast i8* %0 to { double, %string*, double }*
  %a = getelementptr inbounds { double, %string*, double }, { double, %string*, double }* %1, i32 0, i32 0
  store double 1.000000e+00, double* %a
  %2 = call i8* @_ZN2GC8allocateEj(i32 32)
  %3 = bitcast i8* %2 to %string*
  %4 = call %string* @_ZN6stringC1EPKa(%string* %3, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %b = getelementptr inbounds { double, %string*, double }, { double, %string*, double }* %1, i32 0, i32 1
  store %string* %3, %string** %b
  %c = getelementptr inbounds { double, %string*, double }, { double, %string*, double }* %1, i32 0, i32 2
  store double 0.000000e+00, double* %c
  %5 = call i8* @_ZN2GC8allocateEj(i32 8)
  %6 = bitcast i8* %5 to { double, %string*, double }**
  store { double, %string*, double }* %1, { double, %string*, double }** %6
  %.load = load { double, %string*, double }*, { double, %string*, double }** %6
  %a1 = getelementptr inbounds { double, %string*, double }, { double, %string*, double }* %.load, i32 0, i32 0
  %a1.load = load double, double* %a1
  call void @_ZN7console3logIdEEvT_(double %a1.load)
  %.load2 = load { double, %string*, double }*, { double, %string*, double }** %6
  %b3 = getelementptr inbounds { double, %string*, double }, { double, %string*, double }* %.load2, i32 0, i32 1
  %b3.load = load %string*, %string** %b3
  call void @_ZN7console3logIRK6stringEEvT_(%string* %b3.load)
  %.load4 = load { double, %string*, double }*, { double, %string*, double }** %6
  %c5 = getelementptr inbounds { double, %string*, double }, { double, %string*, double }* %.load4, i32 0, i32 2
  %c5.load = load double, double* %c5
  call void @_ZN7console3logIdEEvT_(double %c5.load)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare void @_ZN7console3logIdEEvT_(double)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)
