; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i64, i64, i64, i64 }
%A.B.union = type { double*, %string*, double* }
%number.false.true.union = type { double*, i1*, i1* }
%string.number.union = type { %string*, double* }

@0 = private unnamed_addr constant [2 x i8] c"h\00"
@1 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 1.200000e+01, double* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 32)
  %3 = bitcast i8* %2 to %string*
  %4 = call %string* @_ZN6stringC1EPKa(%string* %3, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %5 = call i8* @_ZN2GC8allocateEj(i32 16)
  %6 = bitcast i8* %5 to { double*, %string* }*
  %a = getelementptr inbounds { double*, %string* }, { double*, %string* }* %6, i32 0, i32 0
  store double* %1, double** %a
  %b = getelementptr inbounds { double*, %string* }, { double*, %string* }* %6, i32 0, i32 1
  store %string* %3, %string** %b
  %.load = load { double*, %string* }, { double*, %string* }* %6
  %7 = extractvalue { double*, %string* } %.load, 0
  %8 = insertvalue %A.B.union zeroinitializer, double* %7, 0
  %9 = extractvalue { double*, %string* } %.load, 1
  %10 = insertvalue %A.B.union %8, %string* %9, 1
  %11 = call i8* @_ZN2GC8allocateEj(i32 24)
  %12 = bitcast i8* %11 to %A.B.union*
  store %A.B.union %10, %A.B.union* %12
  %a1 = getelementptr inbounds %A.B.union, %A.B.union* %12, i32 0, i32 0
  %13 = load double*, double** %a1
  %14 = load double, double* %13
  call void @_ZN7console3logIdEEvT_(double %14)
  %b2 = getelementptr inbounds %A.B.union, %A.B.union* %12, i32 0, i32 1
  %15 = load %string*, %string** %b2
  call void @_ZN7console3logIRK6stringEEvT_(%string* %15)
  %16 = call i8* @_ZN2GC8allocateEj(i32 8)
  %17 = bitcast i8* %16 to double*
  store double 9.090000e+02, double* %17
  %18 = call i8* @_ZN2GC8allocateEj(i32 8)
  %19 = bitcast i8* %18 to { double* }*
  %c = getelementptr inbounds { double* }, { double* }* %19, i32 0, i32 0
  store double* %17, double** %c
  %.load3 = load { double* }, { double* }* %19
  %20 = extractvalue { double* } %.load3, 0
  %21 = insertvalue %A.B.union zeroinitializer, double* %20, 0
  %22 = call i8* @_ZN2GC8allocateEj(i32 24)
  %23 = bitcast i8* %22 to %A.B.union*
  store %A.B.union %21, %A.B.union* %23
  %24 = load %A.B.union, %A.B.union* %23
  store %A.B.union %24, %A.B.union* %12
  %c4 = getelementptr inbounds %A.B.union, %A.B.union* %12, i32 0, i32 0
  %25 = load double*, double** %c4
  %26 = load double, double* %25
  call void @_ZN7console3logIdEEvT_(double %26)
  %27 = call i8* @_ZN2GC8allocateEj(i32 8)
  %28 = bitcast i8* %27 to double*
  store double 1.200000e+01, double* %28
  %29 = insertvalue %number.false.true.union zeroinitializer, double* %28, 0
  %30 = call i8* @_ZN2GC8allocateEj(i32 24)
  %31 = bitcast i8* %30 to %number.false.true.union*
  store %number.false.true.union %29, %number.false.true.union* %31
  %.load5 = load %number.false.true.union, %number.false.true.union* %31
  %32 = extractvalue %number.false.true.union %.load5, 0
  %33 = load double, double* %32
  call void @_ZN7console3logIdEEvT_(double %33)
  %34 = call i8* @_ZN2GC8allocateEj(i32 1)
  %35 = bitcast i8* %34 to i1*
  store i1 false, i1* %35
  %36 = insertvalue %number.false.true.union zeroinitializer, i1* %35, 1
  %37 = call i8* @_ZN2GC8allocateEj(i32 24)
  %38 = bitcast i8* %37 to %number.false.true.union*
  store %number.false.true.union %36, %number.false.true.union* %38
  %39 = load %number.false.true.union, %number.false.true.union* %38
  store %number.false.true.union %39, %number.false.true.union* %31
  %.load6 = load %number.false.true.union, %number.false.true.union* %31
  %40 = extractvalue %number.false.true.union %.load6, 1
  %41 = load i1, i1* %40
  call void @_ZN7console3logIbEEvT_(i1 %41)
  %42 = call i8* @_ZN2GC8allocateEj(i32 32)
  %43 = bitcast i8* %42 to %string*
  %44 = call %string* @_ZN6stringC1EPKa(%string* %43, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @1, i32 0, i32 0))
  %45 = insertvalue %string.number.union zeroinitializer, %string* %43, 0
  %46 = call i8* @_ZN2GC8allocateEj(i32 16)
  %47 = bitcast i8* %46 to %string.number.union*
  store %string.number.union %45, %string.number.union* %47
  %.load7 = load %string.number.union, %string.number.union* %47
  %48 = extractvalue %string.number.union %.load7, 0
  call void @_ZN7console3logIRK6stringEEvT_(%string* %48)
  %49 = call i8* @_ZN2GC8allocateEj(i32 8)
  %50 = bitcast i8* %49 to double*
  store double 2.200000e+01, double* %50
  %51 = insertvalue %string.number.union zeroinitializer, double* %50, 1
  %52 = call i8* @_ZN2GC8allocateEj(i32 16)
  %53 = bitcast i8* %52 to %string.number.union*
  store %string.number.union %51, %string.number.union* %53
  %54 = load %string.number.union, %string.number.union* %53
  store %string.number.union %54, %string.number.union* %47
  %.load8 = load %string.number.union, %string.number.union* %47
  %55 = extractvalue %string.number.union %.load8, 1
  %56 = load double, double* %55
  call void @_ZN7console3logIdEEvT_(double %56)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare void @_ZN7console3logIdEEvT_(double)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare void @_ZN7console3logIbEEvT_(i1)
