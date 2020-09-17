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
  %2 = call i8* @_ZN2GC8allocateEj(i32 8)
  %3 = bitcast i8* %2 to double*
  store double 1.000000e+00, double* %3
  %4 = load double, double* %3
  %5 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double %4)
  %6 = call i8* @_ZN2GC8allocateEj(i32 8)
  %7 = bitcast i8* %6 to double*
  store double 2.000000e+00, double* %7
  %8 = load double, double* %7
  %9 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double %8)
  %10 = call i8* @_ZN2GC8allocateEj(i32 8)
  %11 = bitcast i8* %10 to double*
  store double 3.000000e+00, double* %11
  %12 = load double, double* %11
  %13 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double %12)
  %14 = call i8* @_ZN2GC8allocateEj(i32 8)
  %15 = bitcast i8* %14 to double*
  store double 4.000000e+00, double* %15
  %16 = load double, double* %15
  %17 = call double @_ZN5ArrayIdE4pushEd(%Array__number__class* %a, double %16)
  %18 = call i8* @_ZN2GC8allocateEj(i32 8)
  %19 = bitcast i8* %18 to double*
  store double 1.000000e+00, double* %19
  %20 = load double, double* %19
  %21 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %20)
  %22 = call i8* @_ZN2GC8allocateEj(i32 8)
  %23 = bitcast i8* %22 to double*
  store double 1.000000e+00, double* %23
  %24 = load double, double* %23
  %25 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %24)
  %26 = load double, double* %21
  %27 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %26)
  %28 = load double, double* %27
  %29 = call double* @_ZN5ArrayIdEixEd(%Array__number__class* %a, double %28)
  %30 = load double, double* %29
  store double %30, double* %25
  %31 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  %32 = call i8* @_ZN2GC8allocateEj(i32 80)
  %33 = bitcast i8* %32 to %Array__boolean__class*
  %34 = call %Array__boolean__class* @_ZN5ArrayIbEC1Ev(%Array__boolean__class* %33)
  %35 = call i8* @_ZN2GC8allocateEj(i32 1)
  %36 = bitcast i8* %35 to i1*
  store i1 false, i1* %36
  %37 = load i1, i1* %36
  %38 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %33, i1 %37)
  %39 = call i8* @_ZN2GC8allocateEj(i32 1)
  %40 = bitcast i8* %39 to i1*
  store i1 true, i1* %40
  %41 = load i1, i1* %40
  %42 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %33, i1 %41)
  %43 = call i32 @_ZNK5ArrayIdE6lengthEv(%Array__number__class* %a)
  %44 = call i8* @_ZN2GC8allocateEj(i32 8)
  %45 = bitcast i8* %44 to double*
  store double 4.000000e+00, double* %45
  %46 = load double, double* %45
  %47 = fptosi double %46 to i128
  %48 = trunc i128 %47 to i32
  %49 = icmp eq i32 %43, %48
  %50 = call double @_ZN5ArrayIbE4pushEb(%Array__boolean__class* %33, i1 %49)
  %51 = call i8* @_ZN2GC8allocateEj(i32 32)
  %bar = bitcast i8* %51 to %string*
  %52 = call %string* @_ZN6stringC1EPKa(%string* %bar, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  %53 = call i8* @_ZN2GC8allocateEj(i32 32)
  %54 = bitcast i8* %53 to %string*
  %55 = call %string* @_ZN6stringC1EPKa(%string* %54, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0))
  %56 = call i8* @_ZN2GC8allocateEj(i32 80)
  %57 = bitcast i8* %56 to %Array__string__class*
  %58 = call %Array__string__class* @_ZN5ArrayI6stringEC1Ev(%Array__string__class* %57)
  %59 = call i8* @_ZN2GC8allocateEj(i32 32)
  %60 = bitcast i8* %59 to %string*
  %61 = call %string* @_ZN6stringC1EPKa(%string* %60, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0))
  %62 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %57, %string* %60)
  %63 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %57, %string* %bar)
  %64 = call double @_ZN5ArrayI6stringE4pushES0_(%Array__string__class* %57, %string* %54)
  %65 = call i8* @_ZN2GC8allocateEj(i32 80)
  %arr = bitcast i8* %65 to %Array__number__class*
  %66 = call %Array__number__class* @_ZN5ArrayIdEC1Ev(%Array__number__class* %arr)
  %67 = call i8* @_ZN2GC8allocateEj(i32 8)
  %68 = bitcast i8* %67 to double*
  store double 1.000000e+00, double* %68
  %69 = call i8* @_ZN2GC8allocateEj(i32 8)
  %70 = bitcast i8* %69 to double*
  store double 2.000000e+00, double* %70
  %71 = call i8* @_ZN2GC8allocateEj(i32 8)
  %72 = bitcast i8* %71 to double*
  store double 3.000000e+00, double* %72
  %73 = load double, double* %68
  %74 = load double, double* %70
  %75 = load double, double* %72
  %76 = call double @_ZN5ArrayIdE4pushIJddEEEddDpT_(%Array__number__class* %arr, double %73, double %74, double %75)
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

declare double @_ZN5ArrayIdE4pushIJddEEEddDpT_(%Array__number__class*, double, double, double)
