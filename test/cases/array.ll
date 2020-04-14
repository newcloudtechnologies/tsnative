; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%Array__string__class = type { double }
%string = type { i8*, i32 }
%Array__boolean__class = type { double }
%Array__number__class = type { double }

@0 = private unnamed_addr constant [4 x i8] c"bar\00"
@1 = private unnamed_addr constant [4 x i8] c"baz\00"
@2 = private unnamed_addr constant [4 x i8] c"foo\00"

define i32 @main() {
entry:
  %e = alloca %Array__string__class*
  %baz = alloca %string
  %d = alloca %Array__boolean__class*
  %c = alloca double
  %b = alloca double
  %0 = call i8* @gc__allocate(i32 8)
  %1 = bitcast i8* %0 to %Array__number__class*
  %a = call %Array__number__class* @_ZN5ArrayIdEC1Ev(%Array__number__class* %1)
  %2 = call %Array__number__class* @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 1.000000e+00)
  %3 = call %Array__number__class* @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 2.000000e+00)
  %4 = call %Array__number__class* @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 3.000000e+00)
  %5 = call %Array__number__class* @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double 4.000000e+00)
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
  %10 = call double @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  store double %10, double* %c
  %11 = call i8* @gc__allocate(i32 8)
  %12 = bitcast i8* %11 to %Array__boolean__class*
  %13 = call %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class* %12)
  %14 = call %Array__boolean__class* @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %13, i1 false)
  %15 = call %Array__boolean__class* @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %13, i1 true)
  %16 = call double @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  %17 = fcmp oeq double %16, 4.000000e+00
  %18 = call %Array__boolean__class* @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %13, i1 %17)
  store %Array__boolean__class* %13, %Array__boolean__class** %d
  store %string { i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0), i32 3 }, %string* %baz
  %19 = call i8* @gc__allocate(i32 8)
  %20 = bitcast i8* %19 to %Array__string__class*
  %21 = call %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class* %20)
  %22 = call %Array__string__class* @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %21, %string { i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0), i32 3 })
  %23 = call %Array__string__class* @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %21, %string { i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0), i32 3 })
  %baz.load = load %string, %string* %baz
  %24 = call %Array__string__class* @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %21, %string %baz.load)
  store %Array__string__class* %21, %Array__string__class** %e
  ret i32 0
}

declare %Array__number__class* @_ZN5ArrayIdEC1Ev(%Array__number__class*)

declare i8* @gc__allocate(i32)

declare %Array__number__class* @_ZN5ArrayIdE4pushEd(%Array__number__class*, double)

declare double* @_ZN5ArrayIdEixEd(%Array__number__class*, double)

declare double @_ZNK5ArrayIdE6lengthEv(%Array__number__class*)

declare %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class*)

declare %Array__boolean__class* @_ZN5ArrayIbE4pushEb(%Array__boolean__class*, i1)

declare %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class*)

declare %Array__string__class* @_ZN5ArrayI6stringE4pushES0_(%Array__string__class*, %string)
