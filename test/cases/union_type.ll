; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i64, i64, i64, i64 }
%A.B.union = type { double, %string*, double }
%number.false.true.union = type { double, i1, i1 }
%string.number.union = type { %string*, double }

@0 = private unnamed_addr constant [2 x i8] c"h\00"
@1 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 16)
  %1 = bitcast i8* %0 to { double, %string* }*
  %a = getelementptr inbounds { double, %string* }, { double, %string* }* %1, i32 0, i32 0
  store double 1.200000e+01, double* %a
  %2 = call i8* @_ZN2GC8allocateEj(i32 32)
  %3 = bitcast i8* %2 to %string*
  %4 = call %string* @_ZN6stringC1EPKa(%string* %3, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %b = getelementptr inbounds { double, %string* }, { double, %string* }* %1, i32 0, i32 1
  store %string* %3, %string** %b
  %.load = load { double, %string* }, { double, %string* }* %1
  %5 = extractvalue { double, %string* } %.load, 0
  %6 = insertvalue %A.B.union zeroinitializer, double %5, 0
  %7 = extractvalue { double, %string* } %.load, 1
  %8 = insertvalue %A.B.union %6, %string* %7, 1
  %9 = call i8* @_ZN2GC8allocateEj(i32 24)
  %10 = bitcast i8* %9 to %A.B.union*
  store %A.B.union %8, %A.B.union* %10
  %a1 = getelementptr inbounds %A.B.union, %A.B.union* %10, i32 0, i32 0
  %a1.load = load double, double* %a1
  call void @_ZN7console3logIdEEvT_(double %a1.load)
  %b2 = getelementptr inbounds %A.B.union, %A.B.union* %10, i32 0, i32 1
  %b2.load = load %string*, %string** %b2
  call void @_ZN7console3logIRK6stringEEvT_(%string* %b2.load)
  %11 = call i8* @_ZN2GC8allocateEj(i32 8)
  %12 = bitcast i8* %11 to { double }*
  %c = getelementptr inbounds { double }, { double }* %12, i32 0, i32 0
  store double 9.090000e+02, double* %c
  %.load3 = load { double }, { double }* %12
  %13 = extractvalue { double } %.load3, 0
  %14 = insertvalue %A.B.union zeroinitializer, double %13, 0
  store %A.B.union %14, %A.B.union* %10
  %c4 = getelementptr inbounds %A.B.union, %A.B.union* %10, i32 0, i32 0
  %c4.load = load double, double* %c4
  call void @_ZN7console3logIdEEvT_(double %c4.load)
  %15 = call i8* @_ZN2GC8allocateEj(i32 16)
  %16 = bitcast i8* %15 to %number.false.true.union*
  store %number.false.true.union { double 1.200000e+01, i1 false, i1 false }, %number.false.true.union* %16
  %.load5 = load %number.false.true.union, %number.false.true.union* %16
  %17 = extractvalue %number.false.true.union %.load5, 0
  call void @_ZN7console3logIdEEvT_(double %17)
  store %number.false.true.union zeroinitializer, %number.false.true.union* %16
  %.load6 = load %number.false.true.union, %number.false.true.union* %16
  %18 = extractvalue %number.false.true.union %.load6, 1
  call void @_ZN7console3logIbEEvT_(i1 %18)
  %19 = call i8* @_ZN2GC8allocateEj(i32 32)
  %20 = bitcast i8* %19 to %string*
  %21 = call %string* @_ZN6stringC1EPKa(%string* %20, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @1, i32 0, i32 0))
  %22 = insertvalue %string.number.union zeroinitializer, %string* %20, 0
  %23 = call i8* @_ZN2GC8allocateEj(i32 16)
  %24 = bitcast i8* %23 to %string.number.union*
  store %string.number.union %22, %string.number.union* %24
  %.load7 = load %string.number.union, %string.number.union* %24
  %25 = extractvalue %string.number.union %.load7, 0
  call void @_ZN7console3logIRK6stringEEvT_(%string* %25)
  store %string.number.union { %string* null, double 2.200000e+01 }, %string.number.union* %24
  %.load8 = load %string.number.union, %string.number.union* %24
  %26 = extractvalue %string.number.union %.load8, 1
  call void @_ZN7console3logIdEEvT_(double %26)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare void @_ZN7console3logIdEEvT_(double)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare void @_ZN7console3logIbEEvT_(i1)
