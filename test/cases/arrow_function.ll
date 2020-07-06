; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%env = type {}
%cls__void___env______env_ = type { void (%env*)*, %env* }
%cls__void___env___double_____env_ = type { void (%env*, double)*, %env* }
%cls__double___env___double_____env_ = type { double (%env*, double)*, %env* }
%cls__double___env___double__double_____env_ = type { double (%env*, double, double)*, %env* }
%cls___string____env____string______env_ = type { %string* (%env*, %string*)*, %env* }
%string = type { i64, i64, i64, i64 }
%cls__void___env___void___env___double____double_____env_ = type { void (%env*, void (%env*, double)*, double)*, %env* }
%cls__void___env______env______env_ = type { void (%env*)* (%env*)*, %env* }

@0 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to %env*
  store %env zeroinitializer, %env* %1
  %2 = insertvalue %cls__void___env______env_ { void (%env*)* @1, %env* null }, %env* %1, 1
  %3 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__ = bitcast i8* %3 to %cls__void___env______env_*
  store %cls__void___env______env_ %2, %cls__void___env______env_* %__closure__
  %4 = load %cls__void___env______env_, %cls__void___env______env_* %__closure__
  %5 = extractvalue %cls__void___env______env_ %4, 0
  %6 = extractvalue %cls__void___env______env_ %4, 1
  call void %5(%env* %6)
  %7 = call i8* @_ZN2GC8allocateEj(i32 1)
  %8 = bitcast i8* %7 to %env*
  store %env zeroinitializer, %env* %8
  %9 = insertvalue %cls__void___env___double_____env_ { void (%env*, double)* @2, %env* null }, %env* %8, 1
  %10 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__1 = bitcast i8* %10 to %cls__void___env___double_____env_*
  store %cls__void___env___double_____env_ %9, %cls__void___env___double_____env_* %__closure__1
  %11 = load %cls__void___env___double_____env_, %cls__void___env___double_____env_* %__closure__1
  %12 = extractvalue %cls__void___env___double_____env_ %11, 0
  %13 = extractvalue %cls__void___env___double_____env_ %11, 1
  call void %12(%env* %13, double 1.200000e+01)
  %14 = call i8* @_ZN2GC8allocateEj(i32 1)
  %15 = bitcast i8* %14 to %env*
  store %env zeroinitializer, %env* %15
  %16 = insertvalue %cls__double___env___double_____env_ { double (%env*, double)* @3, %env* null }, %env* %15, 1
  %17 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__2 = bitcast i8* %17 to %cls__double___env___double_____env_*
  store %cls__double___env___double_____env_ %16, %cls__double___env___double_____env_* %__closure__2
  %18 = load %cls__double___env___double_____env_, %cls__double___env___double_____env_* %__closure__2
  %19 = extractvalue %cls__double___env___double_____env_ %18, 0
  %20 = extractvalue %cls__double___env___double_____env_ %18, 1
  %21 = call double %19(%env* %20, double 1.200000e+01)
  %22 = call i8* @_ZN2GC8allocateEj(i32 1)
  %23 = bitcast i8* %22 to %env*
  store %env zeroinitializer, %env* %23
  %24 = insertvalue %cls__double___env___double__double_____env_ { double (%env*, double, double)* @4, %env* null }, %env* %23, 1
  %25 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__3 = bitcast i8* %25 to %cls__double___env___double__double_____env_*
  store %cls__double___env___double__double_____env_ %24, %cls__double___env___double__double_____env_* %__closure__3
  %26 = load %cls__double___env___double__double_____env_, %cls__double___env___double__double_____env_* %__closure__3
  %27 = extractvalue %cls__double___env___double__double_____env_ %26, 0
  %28 = extractvalue %cls__double___env___double__double_____env_ %26, 1
  %29 = call double %27(%env* %28, double 1.200000e+01, double 1.000000e+00)
  %30 = call i8* @_ZN2GC8allocateEj(i32 1)
  %31 = bitcast i8* %30 to %env*
  store %env zeroinitializer, %env* %31
  %32 = insertvalue %cls___string____env____string______env_ { %string* (%env*, %string*)* @5, %env* null }, %env* %31, 1
  %33 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__4 = bitcast i8* %33 to %cls___string____env____string______env_*
  store %cls___string____env____string______env_ %32, %cls___string____env____string______env_* %__closure__4
  %34 = call i8* @_ZN2GC8allocateEj(i32 32)
  %35 = bitcast i8* %34 to %string*
  %36 = call %string* @_ZN6stringC1EPKa(%string* %35, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %37 = load %cls___string____env____string______env_, %cls___string____env____string______env_* %__closure__4
  %38 = extractvalue %cls___string____env____string______env_ %37, 0
  %39 = extractvalue %cls___string____env____string______env_ %37, 1
  %40 = call %string* %38(%env* %39, %string* %35)
  %41 = call i8* @_ZN2GC8allocateEj(i32 1)
  %42 = bitcast i8* %41 to %env*
  store %env zeroinitializer, %env* %42
  %43 = insertvalue %cls__void___env___void___env___double____double_____env_ { void (%env*, void (%env*, double)*, double)* @6, %env* null }, %env* %42, 1
  %44 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__5 = bitcast i8* %44 to %cls__void___env___void___env___double____double_____env_*
  store %cls__void___env___void___env___double____double_____env_ %43, %cls__void___env___void___env___double____double_____env_* %__closure__5
  %45 = call i8* @_ZN2GC8allocateEj(i32 1)
  %46 = bitcast i8* %45 to %env*
  store %env zeroinitializer, %env* %46
  %47 = insertvalue %cls__void___env___double_____env_ { void (%env*, double)* @7, %env* null }, %env* %46, 1
  %48 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__6 = bitcast i8* %48 to %cls__void___env___double_____env_*
  store %cls__void___env___double_____env_ %47, %cls__void___env___double_____env_* %__closure__6
  %49 = load %cls__void___env___double_____env_, %cls__void___env___double_____env_* %__closure__6
  %50 = extractvalue %cls__void___env___double_____env_ %49, 0
  %51 = load %cls__void___env___void___env___double____double_____env_, %cls__void___env___void___env___double____double_____env_* %__closure__5
  %52 = extractvalue %cls__void___env___void___env___double____double_____env_ %51, 0
  %53 = extractvalue %cls__void___env___void___env___double____double_____env_ %51, 1
  call void %52(%env* %53, void (%env*, double)* %50, double 2.200000e+01)
  %54 = call i8* @_ZN2GC8allocateEj(i32 1)
  %55 = bitcast i8* %54 to %env*
  store %env zeroinitializer, %env* %55
  %56 = insertvalue %cls__void___env______env______env_ { void (%env*)* (%env*)* @8, %env* null }, %env* %55, 1
  %57 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__7 = bitcast i8* %57 to %cls__void___env______env______env_*
  store %cls__void___env______env______env_ %56, %cls__void___env______env______env_* %__closure__7
  %58 = call i8* @_ZN2GC8allocateEj(i32 1)
  %59 = bitcast i8* %58 to %env*
  store %env zeroinitializer, %env* %59
  call void @10(%env* %59)
  ret i32 0
}

define void @1(%env* %__environment__) {
entry:
  ret void
}

declare i8* @_ZN2GC8allocateEj(i32)

define void @2(%env* %__environment__, double %_) {
entry:
  ret void
}

define double @3(%env* %__environment__, double %v) {
entry:
  ret double %v
}

define double @4(%env* %__environment__, double %v, double %u) {
entry:
  %0 = fadd double %v, %u
  ret double %0
}

define %string* @5(%env* %__environment__, %string* %u) {
entry:
  ret %string* %u
}

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

define void @6(%env* %__environment__, void (%env*, double)* %fn, double %v) {
entry:
  %0 = alloca %env
  %1 = load %env, %env* %__environment__
  call void %fn(%env* %0, double %v)
  ret void
}

define void @7(%env* %__environment__, double %v) {
entry:
  call void @_ZN7console3logIdEEvT_(double %v)
  ret void
}

declare void @_ZN7console3logIdEEvT_(double)

define void (%env*)* @8(%env* %__environment__) {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to %env*
  store %env zeroinitializer, %env* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 1)
  %3 = bitcast i8* %2 to %env*
  store %env zeroinitializer, %env* %3
  %4 = insertvalue %cls__void___env______env_ { void (%env*)* @9, %env* null }, %env* %3, 1
  %5 = call i8* @_ZN2GC8allocateEj(i32 16)
  %__closure__ = bitcast i8* %5 to %cls__void___env______env_*
  store %cls__void___env______env_ %4, %cls__void___env______env_* %__closure__
  ret void (%env*)* @9
}

define void @9(%env* %__environment__) {
entry:
  call void @_ZN7console3logIdEEvT_(double 2.200000e+01)
  ret void
}

define void @10(%env* %__environment__) {
entry:
  call void @_ZN7console3logIdEEvT_(double 2.200000e+01)
  ret void
}
