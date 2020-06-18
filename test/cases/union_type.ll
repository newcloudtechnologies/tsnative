; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string.number.union = type { %string*, double }
%string = type { i64, i64, i64, i64 }
%number.false.true.union = type { double, i1, i1 }
%A.B.union = type { double, %string*, double }

@0 = private unnamed_addr constant [2 x i8] c"h\00"
@1 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %union7 = alloca %string.number.union
  %union5 = alloca %number.false.true.union
  %union = alloca %A.B.union
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
  store %A.B.union %8, %A.B.union* %union
  %a1 = getelementptr inbounds %A.B.union, %A.B.union* %union, i32 0, i32 0
  %a1.load = load double, double* %a1
  call void @_ZN7console3logIdEEvT_(double %a1.load)
  %b2 = getelementptr inbounds %A.B.union, %A.B.union* %union, i32 0, i32 1
  %b2.load = load %string*, %string** %b2
  call void @_ZN7console3logIRK6stringEEvT_(%string* %b2.load)
  %9 = call i8* @_ZN2GC8allocateEj(i32 8)
  %10 = bitcast i8* %9 to { double }*
  %c = getelementptr inbounds { double }, { double }* %10, i32 0, i32 0
  store double 9.090000e+02, double* %c
  %.load3 = load { double }, { double }* %10
  %11 = extractvalue { double } %.load3, 0
  %12 = insertvalue %A.B.union zeroinitializer, double %11, 0
  store %A.B.union %12, %A.B.union* %union
  %c4 = getelementptr inbounds %A.B.union, %A.B.union* %union, i32 0, i32 0
  %c4.load = load double, double* %c4
  call void @_ZN7console3logIdEEvT_(double %c4.load)
  store %number.false.true.union { double 1.200000e+01, i1 false, i1 false }, %number.false.true.union* %union5
  %union5.load = load %number.false.true.union, %number.false.true.union* %union5
  %13 = extractvalue %number.false.true.union %union5.load, 0
  call void @_ZN7console3logIdEEvT_(double %13)
  store %number.false.true.union zeroinitializer, %number.false.true.union* %union5
  %union5.load6 = load %number.false.true.union, %number.false.true.union* %union5
  %14 = extractvalue %number.false.true.union %union5.load6, 1
  call void @_ZN7console3logIbEEvT_(i1 %14)
  %15 = call i8* @_ZN2GC8allocateEj(i32 32)
  %16 = bitcast i8* %15 to %string*
  %17 = call %string* @_ZN6stringC1EPKa(%string* %16, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @1, i32 0, i32 0))
  %18 = insertvalue %string.number.union zeroinitializer, %string* %16, 0
  store %string.number.union %18, %string.number.union* %union7
  %union7.load = load %string.number.union, %string.number.union* %union7
  %19 = extractvalue %string.number.union %union7.load, 0
  call void @_ZN7console3logIRK6stringEEvT_(%string* %19)
  store %string.number.union { %string* null, double 2.200000e+01 }, %string.number.union* %union7
  %union7.load8 = load %string.number.union, %string.number.union* %union7
  %20 = extractvalue %string.number.union %union7.load8, 1
  call void @_ZN7console3logIdEEvT_(double %20)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare void @_ZN7console3logIdEEvT_(double)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare void @_ZN7console3logIbEEvT_(i1)
