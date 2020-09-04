; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__()" = type {}
%"cls__(_void (%env__()*)*_%env__()*)" = type { void (%"env__()"*)*, %"env__()"* }
%"env__(_double*)" = type { double* }
%"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" = type { void (%"env__(_double*)"*)*, %"env__(_double*)"* }
%"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" = type { double* (%"env__(_double*)"*)*, %"env__(_double*)"* }
%"env__(_double*_double*)" = type { double*, double* }
%"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" = type { double* (%"env__(_double*_double*)"*)*, %"env__(_double*_double*)"* }
%"env__(_%string*)" = type { %string* }
%string = type { i64, i64, i64, i64 }
%"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" = type { %string* (%"env__(_%string*)"*)*, %"env__(_%string*)"* }
%"dirty__cls__()" = type {}
%"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)" = type { %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"*, double* }
%"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)" = type { %"cls__(_void (%env__()*)*_%env__()*)"* (%"env__()"*)*, %"env__()"* }

@0 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %1
  %2 = insertvalue %"cls__(_void (%env__()*)*_%env__()*)" { void (%"env__()"*)* @1, %"env__()"* null }, %"env__()"* %1, 1
  %3 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__ = bitcast i8* %3 to %"cls__(_void (%env__()*)*_%env__()*)"*
  store %"cls__(_void (%env__()*)*_%env__()*)" %2, %"cls__(_void (%env__()*)*_%env__()*)"* %__closure__
  %4 = load %"cls__(_void (%env__()*)*_%env__()*)", %"cls__(_void (%env__()*)*_%env__()*)"* %__closure__
  %5 = extractvalue %"cls__(_void (%env__()*)*_%env__()*)" %4, 0
  %6 = extractvalue %"cls__(_void (%env__()*)*_%env__()*)" %4, 1
  call void %5(%"env__()"* %6)
  %7 = call i8* @_ZN2GC8allocateEj(i32 8)
  %8 = bitcast i8* %7 to %"env__(_double*)"*
  store %"env__(_double*)" zeroinitializer, %"env__(_double*)"* %8
  %9 = insertvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" { void (%"env__(_double*)"*)* @2, %"env__(_double*)"* null }, %"env__(_double*)"* %8, 1
  %10 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__1 = bitcast i8* %10 to %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"*
  store %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %9, %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__1
  %11 = call i8* @_ZN2GC8allocateEj(i32 8)
  %12 = bitcast i8* %11 to double*
  store double 1.200000e+01, double* %12
  %13 = load %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)", %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__1
  %14 = extractvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %13, 0
  %15 = extractvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %13, 1
  %16 = getelementptr inbounds %"env__(_double*)", %"env__(_double*)"* %15, i32 0, i32 0
  store double* %12, double** %16
  call void %14(%"env__(_double*)"* %15)
  %17 = call i8* @_ZN2GC8allocateEj(i32 8)
  %18 = bitcast i8* %17 to %"env__(_double*)"*
  store %"env__(_double*)" zeroinitializer, %"env__(_double*)"* %18
  %19 = insertvalue %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" { double* (%"env__(_double*)"*)* @3, %"env__(_double*)"* null }, %"env__(_double*)"* %18, 1
  %20 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__2 = bitcast i8* %20 to %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)"*
  store %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" %19, %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__2
  %21 = call i8* @_ZN2GC8allocateEj(i32 8)
  %22 = bitcast i8* %21 to double*
  store double 1.200000e+01, double* %22
  %23 = load %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)", %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__2
  %24 = extractvalue %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" %23, 0
  %25 = extractvalue %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" %23, 1
  %26 = getelementptr inbounds %"env__(_double*)", %"env__(_double*)"* %25, i32 0, i32 0
  store double* %22, double** %26
  %27 = call double* %24(%"env__(_double*)"* %25)
  %28 = call i8* @_ZN2GC8allocateEj(i32 16)
  %29 = bitcast i8* %28 to %"env__(_double*_double*)"*
  store %"env__(_double*_double*)" zeroinitializer, %"env__(_double*_double*)"* %29
  %30 = insertvalue %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" { double* (%"env__(_double*_double*)"*)* @4, %"env__(_double*_double*)"* null }, %"env__(_double*_double*)"* %29, 1
  %31 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__3 = bitcast i8* %31 to %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)"*
  store %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" %30, %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)"* %__closure__3
  %32 = call i8* @_ZN2GC8allocateEj(i32 8)
  %33 = bitcast i8* %32 to double*
  store double 1.200000e+01, double* %33
  %34 = call i8* @_ZN2GC8allocateEj(i32 8)
  %35 = bitcast i8* %34 to double*
  store double 1.000000e+00, double* %35
  %36 = load %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)", %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)"* %__closure__3
  %37 = extractvalue %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" %36, 0
  %38 = extractvalue %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" %36, 1
  %39 = getelementptr inbounds %"env__(_double*_double*)", %"env__(_double*_double*)"* %38, i32 0, i32 0
  store double* %33, double** %39
  %40 = getelementptr inbounds %"env__(_double*_double*)", %"env__(_double*_double*)"* %38, i32 0, i32 1
  store double* %35, double** %40
  %41 = call double* %37(%"env__(_double*_double*)"* %38)
  %42 = call i8* @_ZN2GC8allocateEj(i32 8)
  %43 = bitcast i8* %42 to %"env__(_%string*)"*
  store %"env__(_%string*)" zeroinitializer, %"env__(_%string*)"* %43
  %44 = insertvalue %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" { %string* (%"env__(_%string*)"*)* @5, %"env__(_%string*)"* null }, %"env__(_%string*)"* %43, 1
  %45 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__4 = bitcast i8* %45 to %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)"*
  store %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" %44, %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)"* %__closure__4
  %46 = call i8* @_ZN2GC8allocateEj(i32 32)
  %47 = bitcast i8* %46 to %string*
  %48 = call %string* @_ZN6stringC1EPKa(%string* %47, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %49 = load %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)", %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)"* %__closure__4
  %50 = extractvalue %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" %49, 0
  %51 = extractvalue %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" %49, 1
  %52 = getelementptr inbounds %"env__(_%string*)", %"env__(_%string*)"* %51, i32 0, i32 0
  store %string* %47, %string** %52
  %53 = call %string* %50(%"env__(_%string*)"* %51)
  %54 = call i8* @_ZN2GC8allocateEj(i32 1)
  %f = bitcast i8* %54 to %"dirty__cls__()"*
  store %"dirty__cls__()" zeroinitializer, %"dirty__cls__()"* %f
  %55 = call i8* @_ZN2GC8allocateEj(i32 8)
  %56 = bitcast i8* %55 to %"env__(_double*)"*
  store %"env__(_double*)" zeroinitializer, %"env__(_double*)"* %56
  %57 = insertvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" { void (%"env__(_double*)"*)* @6, %"env__(_double*)"* null }, %"env__(_double*)"* %56, 1
  %58 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__5 = bitcast i8* %58 to %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"*
  store %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %57, %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__5
  %59 = call i8* @_ZN2GC8allocateEj(i32 8)
  %60 = bitcast i8* %59 to double*
  store double 2.200000e+01, double* %60
  %61 = load %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)", %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__5
  %62 = extractvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %61, 1
  %63 = insertvalue %"env__(_double*)" zeroinitializer, double* %60, 0
  %64 = call i8* @_ZN2GC8allocateEj(i32 8)
  %65 = bitcast i8* %64 to %"env__(_double*)"*
  store %"env__(_double*)" %63, %"env__(_double*)"* %65
  %66 = load %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)", %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__5
  %67 = extractvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %66, 0
  %68 = insertvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" zeroinitializer, void (%"env__(_double*)"*)* %67, 0
  %69 = insertvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %68, %"env__(_double*)"* %65, 1
  %70 = call i8* @_ZN2GC8allocateEj(i32 16)
  %71 = bitcast i8* %70 to %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"*
  store %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %69, %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %71
  %72 = insertvalue %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)" zeroinitializer, %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %71, 0
  %73 = insertvalue %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)" %72, double* %60, 1
  %74 = call i8* @_ZN2GC8allocateEj(i32 16)
  %75 = bitcast i8* %74 to %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)"*
  store %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)" %73, %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)"* %75
  call void @7(%"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)"* %75)
  %76 = call i8* @_ZN2GC8allocateEj(i32 1)
  %77 = bitcast i8* %76 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %77
  %78 = insertvalue %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)" { %"cls__(_void (%env__()*)*_%env__()*)"* (%"env__()"*)* @9, %"env__()"* null }, %"env__()"* %77, 1
  %79 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__8 = bitcast i8* %79 to %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)"*
  store %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)" %78, %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)"* %__closure__8
  %80 = call i8* @_ZN2GC8allocateEj(i32 1)
  %81 = bitcast i8* %80 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %81
  call void @11(%"env__()"* %81)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @1(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  ret void
}

define void @2(%"env__(_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*)", %"env__(_double*)"* %__environment__
  ret void
}

define double* @3(%"env__(_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*)", %"env__(_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*)" %0, 0
  ret double* %1
}

define double* @4(%"env__(_double*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*_double*)", %"env__(_double*_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*_double*)" %0, 0
  %2 = extractvalue %"env__(_double*_double*)" %0, 1
  %3 = load double, double* %1
  %4 = load double, double* %2
  %5 = fadd double %3, %4
  %6 = call i8* @_ZN2GC8allocateEj(i32 8)
  %7 = bitcast i8* %6 to double*
  store double %5, double* %7
  ret double* %7
}

define %string* @5(%"env__(_%string*)"* %__environment__) {
entry:
  %0 = load %"env__(_%string*)", %"env__(_%string*)"* %__environment__
  %1 = extractvalue %"env__(_%string*)" %0, 0
  ret %string* %1
}

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

define void @6(%"env__(_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*)", %"env__(_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*)" %0, 0
  %2 = load double, double* %1
  call void @_ZN7console3logIdEEvT_(double %2)
  ret void
}

declare void @_ZN7console3logIdEEvT_(double)

define void @7(%"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)", %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)"* %__environment__
  %1 = extractvalue %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)" %0, 1
  %2 = extractvalue %"env__(_%cls__(_void (%env__(_double*)*)*_%env__(_double*)*)*_double*)" %0, 0
  %3 = load %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)", %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %2
  %4 = extractvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %3, 0
  %5 = extractvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %3, 1
  %6 = getelementptr inbounds %"env__(_double*)", %"env__(_double*)"* %5, i32 0, i32 0
  store double* %1, double** %6
  call void %4(%"env__(_double*)"* %5)
  ret void
}

define void @8(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %1 = call i8* @_ZN2GC8allocateEj(i32 8)
  %2 = bitcast i8* %1 to double*
  store double 2.200000e+01, double* %2
  %3 = load double, double* %2
  call void @_ZN7console3logIdEEvT_(double %3)
  ret void
}

define %"cls__(_void (%env__()*)*_%env__()*)"* @9(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %1 = call i8* @_ZN2GC8allocateEj(i32 1)
  %2 = bitcast i8* %1 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %2
  %3 = insertvalue %"cls__(_void (%env__()*)*_%env__()*)" { void (%"env__()"*)* @10, %"env__()"* null }, %"env__()"* %2, 1
  %4 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__ = bitcast i8* %4 to %"cls__(_void (%env__()*)*_%env__()*)"*
  store %"cls__(_void (%env__()*)*_%env__()*)" %3, %"cls__(_void (%env__()*)*_%env__()*)"* %__closure__
  ret %"cls__(_void (%env__()*)*_%env__()*)"* %__closure__
}

define void @10(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %1 = call i8* @_ZN2GC8allocateEj(i32 8)
  %2 = bitcast i8* %1 to double*
  store double 2.200000e+01, double* %2
  %3 = load double, double* %2
  call void @_ZN7console3logIdEEvT_(double %3)
  ret void
}

define void @11(%"env__()"* %__environment__) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %1 = call i8* @_ZN2GC8allocateEj(i32 8)
  %2 = bitcast i8* %1 to double*
  store double 2.200000e+01, double* %2
  %3 = load double, double* %2
  call void @_ZN7console3logIdEEvT_(double %3)
  ret void
}
