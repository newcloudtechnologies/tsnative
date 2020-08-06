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
%"env__(_void (double*)*_double*)" = type { void (double*)*, double* }
%"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)" = type { void (%"env__(_void (double*)*_double*)"*)*, %"env__(_void (double*)*_double*)"* }
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
  call void %14(%"env__(_double*)"* %15)
  %16 = call i8* @_ZN2GC8allocateEj(i32 8)
  %17 = bitcast i8* %16 to %"env__(_double*)"*
  store %"env__(_double*)" zeroinitializer, %"env__(_double*)"* %17
  %18 = insertvalue %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" { double* (%"env__(_double*)"*)* @3, %"env__(_double*)"* null }, %"env__(_double*)"* %17, 1
  %19 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__2 = bitcast i8* %19 to %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)"*
  store %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" %18, %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__2
  %20 = call i8* @_ZN2GC8allocateEj(i32 8)
  %21 = bitcast i8* %20 to double*
  store double 1.200000e+01, double* %21
  %22 = load %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)", %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__2
  %23 = extractvalue %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" %22, 0
  %24 = extractvalue %"cls__(_double* (%env__(_double*)*)*_%env__(_double*)*)" %22, 1
  %25 = call double* %23(%"env__(_double*)"* %24)
  %26 = call i8* @_ZN2GC8allocateEj(i32 16)
  %27 = bitcast i8* %26 to %"env__(_double*_double*)"*
  store %"env__(_double*_double*)" zeroinitializer, %"env__(_double*_double*)"* %27
  %28 = insertvalue %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" { double* (%"env__(_double*_double*)"*)* @4, %"env__(_double*_double*)"* null }, %"env__(_double*_double*)"* %27, 1
  %29 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__3 = bitcast i8* %29 to %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)"*
  store %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" %28, %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)"* %__closure__3
  %30 = call i8* @_ZN2GC8allocateEj(i32 8)
  %31 = bitcast i8* %30 to double*
  store double 1.200000e+01, double* %31
  %32 = call i8* @_ZN2GC8allocateEj(i32 8)
  %33 = bitcast i8* %32 to double*
  store double 1.000000e+00, double* %33
  %34 = load %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)", %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)"* %__closure__3
  %35 = extractvalue %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" %34, 0
  %36 = extractvalue %"cls__(_double* (%env__(_double*_double*)*)*_%env__(_double*_double*)*)" %34, 1
  %37 = call double* %35(%"env__(_double*_double*)"* %36)
  %38 = call i8* @_ZN2GC8allocateEj(i32 8)
  %39 = bitcast i8* %38 to %"env__(_%string*)"*
  store %"env__(_%string*)" zeroinitializer, %"env__(_%string*)"* %39
  %40 = insertvalue %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" { %string* (%"env__(_%string*)"*)* @5, %"env__(_%string*)"* null }, %"env__(_%string*)"* %39, 1
  %41 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__4 = bitcast i8* %41 to %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)"*
  store %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" %40, %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)"* %__closure__4
  %42 = call i8* @_ZN2GC8allocateEj(i32 32)
  %43 = bitcast i8* %42 to %string*
  %44 = call %string* @_ZN6stringC1EPKa(%string* %43, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %45 = load %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)", %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)"* %__closure__4
  %46 = extractvalue %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" %45, 0
  %47 = extractvalue %"cls__(_%string* (%env__(_%string*)*)*_%env__(_%string*)*)" %45, 1
  %48 = call %string* %46(%"env__(_%string*)"* %47)
  %49 = call i8* @_ZN2GC8allocateEj(i32 16)
  %50 = bitcast i8* %49 to %"env__(_void (double*)*_double*)"*
  store %"env__(_void (double*)*_double*)" zeroinitializer, %"env__(_void (double*)*_double*)"* %50
  %51 = insertvalue %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)" { void (%"env__(_void (double*)*_double*)"*)* @6, %"env__(_void (double*)*_double*)"* null }, %"env__(_void (double*)*_double*)"* %50, 1
  %52 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__5 = bitcast i8* %52 to %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)"*
  store %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)" %51, %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)"* %__closure__5
  %53 = call i8* @_ZN2GC8allocateEj(i32 8)
  %54 = bitcast i8* %53 to %"env__(_double*)"*
  store %"env__(_double*)" zeroinitializer, %"env__(_double*)"* %54
  %55 = insertvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" { void (%"env__(_double*)"*)* @7, %"env__(_double*)"* null }, %"env__(_double*)"* %54, 1
  %56 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__6 = bitcast i8* %56 to %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"*
  store %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %55, %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__6
  %57 = call i8* @_ZN2GC8allocateEj(i32 8)
  %58 = bitcast i8* %57 to double*
  store double 2.200000e+01, double* %58
  %59 = load %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)", %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)"* %__closure__6
  %60 = extractvalue %"cls__(_void (%env__(_double*)*)*_%env__(_double*)*)" %59, 0
  %61 = load %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)", %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)"* %__closure__5
  %62 = extractvalue %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)" %61, 0
  %63 = extractvalue %"cls__(_void (%env__(_void (double*)*_double*)*)*_%env__(_void (double*)*_double*)*)" %61, 1
  call void %62(%"env__(_void (double*)*_double*)"* %63)
  %64 = call i8* @_ZN2GC8allocateEj(i32 1)
  %65 = bitcast i8* %64 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %65
  %66 = insertvalue %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)" { %"cls__(_void (%env__()*)*_%env__()*)"* (%"env__()"*)* @9, %"env__()"* null }, %"env__()"* %65, 1
  %67 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__9 = bitcast i8* %67 to %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)"*
  store %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)" %66, %"cls__(_%cls__(_void (%env__()*)*_%env__()*)* (%env__()*)*_%env__()*)"* %__closure__9
  %68 = call i8* @_ZN2GC8allocateEj(i32 1)
  %69 = bitcast i8* %68 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %69
  call void @11(%"env__()"* %69)
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

define void @6(%"env__(_void (double*)*_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_void (double*)*_double*)", %"env__(_void (double*)*_double*)"* %__environment__
  %1 = extractvalue %"env__(_void (double*)*_double*)" %0, 0
  %2 = extractvalue %"env__(_void (double*)*_double*)" %0, 1
  call void %1(double* %2)
  ret void
}

define void @7(%"env__(_double*)"* %__environment__) {
entry:
  %0 = load %"env__(_double*)", %"env__(_double*)"* %__environment__
  %1 = extractvalue %"env__(_double*)" %0, 0
  %2 = load double, double* %1
  call void @_ZN7console3logIdEEvT_(double %2)
  ret void
}

declare void @_ZN7console3logIdEEvT_(double)

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
