; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%Array__string__class = type { i640 }
%string = type { i256 }
%Array__boolean__class = type { i640 }
%Array__number__class = type { i640 }

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
  call void @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 1.000000e+00)
  call void @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 2.000000e+00)
  call void @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 3.000000e+00)
  call void @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 4.000000e+00)
  %2 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double 1.000000e+00)
  %.load = load double, double* %2
  store double %.load, double* %b
  %3 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double 1.000000e+00)
  %b.load = load double, double* %b
  %4 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %b.load)
  %.load1 = load double, double* %4
  %5 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %.load1)
  %.load2 = load double, double* %5
  store double %.load2, double* %3
  %6 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  store i32 %6, i32* %c
  %7 = call i8* @_ZN2GC8allocateEj(i32 80)
  %8 = bitcast i8* %7 to %Array__boolean__class*
  %9 = call %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class* %8)
  call void @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %8, i1 false)
  call void @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %8, i1 true)
  %10 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  %11 = icmp eq i32 %10, 4
  call void @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %8, i1 %11)
  store %Array__boolean__class* %8, %Array__boolean__class** %d
  %12 = call i8* @_ZN2GC8allocateEj(i32 32)
  %bar = bitcast i8* %12 to %string*
  %13 = call %string* @_ZN6stringC1EPKa(%string* %bar, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  %14 = call i8* @_ZN2GC8allocateEj(i32 32)
  %15 = bitcast i8* %14 to %string*
  %16 = call %string* @_ZN6stringC1EPKa(%string* %15, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0))
  store %string* %15, %string** %baz
  %17 = call i8* @_ZN2GC8allocateEj(i32 80)
  %18 = bitcast i8* %17 to %Array__string__class*
  %19 = call %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class* %18)
  %20 = call i8* @_ZN2GC8allocateEj(i32 32)
  %21 = bitcast i8* %20 to %string*
  %22 = call %string* @_ZN6stringC1EPKa(%string* %21, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0))
  call void @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %18, %string* %21)
  call void @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %18, %string* %bar)
  %baz.load = load %string*, %string** %baz
  call void @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %18, %string* %baz.load)
  store %Array__string__class* %18, %Array__string__class** %e
  ret i32 0
}

declare %Array__number__class* @_ZN5ArrayIdEC1Ev(%Array__number__class*)

declare i8* @_ZN2GC8allocateEj(i32)

declare void @_ZN5ArrayIdE4pushEd(%Array__number__class*, double)

declare double* @_ZN5ArrayIdEixEd(%Array__number__class*, double)

declare i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class*)

declare %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class*)

declare void @_ZN5ArrayIbE4pushEb(%Array__boolean__class*, i1)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class*)

declare void @_ZN5ArrayI6stringE4pushES0_(%Array__string__class*, %string*)
