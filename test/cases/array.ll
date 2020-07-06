; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%Array__number__class = type { i64, i64, i64, i64, i64, i64, i64, i64, i64, i64 }
%Array__boolean__class = type { i64, i64, i64, i64, i64, i64, i64, i64, i64, i64 }
%string = type { i64, i64, i64, i64 }
%Array__string__class = type { i64, i64, i64, i64, i64, i64, i64, i64, i64, i64 }

@0 = private unnamed_addr constant [4 x i8] c"bar\00"
@1 = private unnamed_addr constant [4 x i8] c"baz\00"
@2 = private unnamed_addr constant [4 x i8] c"foo\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 80)
  %a = bitcast i8* %0 to %Array__number__class*
  %1 = call %Array__number__class* @_ZN5ArrayIdEC1Ev(%Array__number__class* %a)
  %2 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 1.000000e+00)
  %3 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 2.000000e+00)
  %4 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 3.000000e+00)
  %5 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 4.000000e+00)
  %6 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double 1.000000e+00)
  %.load = load double, double* %6
  %7 = call i8* @_ZN2GC8allocateEj(i32 8)
  %8 = bitcast i8* %7 to double*
  store double %.load, double* %8
  %9 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double 1.000000e+00)
  %.load1 = load double, double* %8
  %10 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %.load1)
  %.load2 = load double, double* %10
  %11 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %.load2)
  %.load3 = load double, double* %11
  store double %.load3, double* %9
  %12 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  %13 = call i8* @_ZN2GC8allocateEj(i32 4)
  %14 = bitcast i8* %13 to i32*
  store i32 %12, i32* %14
  %15 = call i8* @_ZN2GC8allocateEj(i32 80)
  %16 = bitcast i8* %15 to %Array__boolean__class*
  %17 = call %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class* %16)
  %18 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %16, i1 false)
  %19 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %16, i1 true)
  %20 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  %21 = icmp eq i32 %20, 4
  %22 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %16, i1 %21)
  %23 = call i8* @_ZN2GC8allocateEj(i32 80)
  %24 = bitcast i8* %23 to %Array__boolean__class**
  store %Array__boolean__class* %16, %Array__boolean__class** %24
  %25 = call i8* @_ZN2GC8allocateEj(i32 32)
  %bar = bitcast i8* %25 to %string*
  %26 = call %string* @_ZN6stringC1EPKa(%string* %bar, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  %27 = call i8* @_ZN2GC8allocateEj(i32 32)
  %28 = bitcast i8* %27 to %string*
  %29 = call %string* @_ZN6stringC1EPKa(%string* %28, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0))
  %30 = call i8* @_ZN2GC8allocateEj(i32 32)
  %31 = bitcast i8* %30 to %string**
  store %string* %28, %string** %31
  %32 = call i8* @_ZN2GC8allocateEj(i32 80)
  %33 = bitcast i8* %32 to %Array__string__class*
  %34 = call %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class* %33)
  %35 = call i8* @_ZN2GC8allocateEj(i32 32)
  %36 = bitcast i8* %35 to %string*
  %37 = call %string* @_ZN6stringC1EPKa(%string* %36, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0))
  %38 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %33, %string* %36)
  %39 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %33, %string* %bar)
  %.load4 = load %string*, %string** %31
  %40 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %33, %string* %.load4)
  %41 = call i8* @_ZN2GC8allocateEj(i32 80)
  %42 = bitcast i8* %41 to %Array__string__class**
  store %Array__string__class* %33, %Array__string__class** %42
  ret i32 0
}

declare %Array__number__class* @_ZN5ArrayIdEC1Ev(%Array__number__class*)

declare i8* @_ZN2GC8allocateEj(i32)

declare double @_ZN5ArrayIdE4pushEd(%Array__number__class*, double)

declare double* @_ZN5ArrayIdEixEd(%Array__number__class*, double)

declare i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class*)

declare %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class*)

declare double @_ZN5ArrayIbE4pushEb(%Array__boolean__class*, i1)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class*)

declare double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class*, %string*)
