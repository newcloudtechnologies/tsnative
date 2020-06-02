; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%Array__string__class = type { i64, i64, i64, i64, i64, i64, i64, i64, i64, i64 }
%string = type { i256 }
%Array__boolean__class = type { i64, i64, i64, i64, i64, i64, i64, i64, i64, i64 }
%Array__number__class = type { i64, i64, i64, i64, i64, i64, i64, i64, i64, i64 }

@0 = private unnamed_addr constant [4 x i8] c"bar\00"
@1 = private unnamed_addr constant [4 x i8] c"baz\00"
@2 = private unnamed_addr constant [4 x i8] c"foo\00"

define i32 @main() {
entry:
  %e = alloca %Array__string__class*
  %baz = alloca %string*
  %d = alloca %Array__boolean__class*
  %c = alloca i32
  %b = alloca double
  %0 = call i8* @_ZN2GC8allocateEj(i32 80)
  %a = bitcast i8* %0 to %Array__number__class*
  %1 = call %Array__number__class* @_ZN5ArrayIdEC1Ev(%Array__number__class* %a)
  %2 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 1.000000e+00)
  %3 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 2.000000e+00)
  %4 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 3.000000e+00)
  %5 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 4.000000e+00)
  %6 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double 1.000000e+00)
  %.load = load double, double* %6
  store double %.load, double* %b
  %7 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double 1.000000e+00)
  %b.load = load double, double* %b
  %8 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %b.load)
  %.load1 = load double, double* %8
  %9 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %.load1)
  %.load2 = load double, double* %9
  store double %.load2, double* %7
  %10 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  store i32 %10, i32* %c
  %11 = call i8* @_ZN2GC8allocateEj(i32 80)
  %12 = bitcast i8* %11 to %Array__boolean__class*
  %13 = call %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class* %12)
  %14 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %12, i1 false)
  %15 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %12, i1 true)
  %16 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  %17 = icmp eq i32 %16, 4
  %18 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %12, i1 %17)
  store %Array__boolean__class* %12, %Array__boolean__class** %d
  %19 = call i8* @_ZN2GC8allocateEj(i32 32)
  %bar = bitcast i8* %19 to %string*
  %20 = call %string* @_ZN6stringC1EPKa(%string* %bar, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  %21 = call i8* @_ZN2GC8allocateEj(i32 32)
  %22 = bitcast i8* %21 to %string*
  %23 = call %string* @_ZN6stringC1EPKa(%string* %22, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0))
  store %string* %22, %string** %baz
  %24 = call i8* @_ZN2GC8allocateEj(i32 80)
  %25 = bitcast i8* %24 to %Array__string__class*
  %26 = call %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class* %25)
  %27 = call i8* @_ZN2GC8allocateEj(i32 32)
  %28 = bitcast i8* %27 to %string*
  %29 = call %string* @_ZN6stringC1EPKa(%string* %28, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0))
  %30 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %25, %string* %28)
  %31 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %25, %string* %bar)
  %baz.load = load %string*, %string** %baz
  %32 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %25, %string* %baz.load)
  store %Array__string__class* %25, %Array__string__class** %e
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
