; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i64, i64, i64, i64 }

@0 = private unnamed_addr constant [2 x i8] c"h\00"

define i32 @main() {
entry:
  %f6 = alloca void ()* ()*
  %log = alloca void (double)*
  %f5 = alloca void (void (double)*, double)*
  %f4 = alloca %string* (%string*)*
  %f3 = alloca double (double, double)*
  %f2 = alloca double (double)*
  %f1 = alloca void (double)*
  %f = alloca void ()*
  store void ()* @1, void ()** %f
  %0 = load void ()*, void ()** %f
  call void %0()
  store void (double)* @2, void (double)** %f1
  %1 = load void (double)*, void (double)** %f1
  call void %1(double 1.200000e+01)
  store double (double)* @3, double (double)** %f2
  %2 = load double (double)*, double (double)** %f2
  %3 = call double %2(double 1.200000e+01)
  store double (double, double)* @4, double (double, double)** %f3
  %4 = load double (double, double)*, double (double, double)** %f3
  %5 = call double %4(double 1.200000e+01, double 1.000000e+00)
  store %string* (%string*)* @5, %string* (%string*)** %f4
  %6 = call i8* @_ZN2GC8allocateEj(i32 32)
  %7 = bitcast i8* %6 to %string*
  %8 = call %string* @_ZN6stringC1EPKa(%string* %7, i8* getelementptr inbounds ([2 x i8], [2 x i8]* @0, i32 0, i32 0))
  %9 = load %string* (%string*)*, %string* (%string*)** %f4
  %10 = call %string* %9(%string* %7)
  store void (void (double)*, double)* @6, void (void (double)*, double)** %f5
  store void (double)* @7, void (double)** %log
  %log.load = load void (double)*, void (double)** %log
  %11 = load void (void (double)*, double)*, void (void (double)*, double)** %f5
  call void %11(void (double)* %log.load, double 2.200000e+01)
  store void ()* ()* @8, void ()* ()** %f6
  call void @10()
  ret i32 0
}

define void @1() {
entry:
  ret void
}

define void @2(double %_) {
entry:
  ret void
}

define double @3(double %v) {
entry:
  ret double %v
}

define double @4(double %v, double %u) {
entry:
  %0 = fadd double %v, %u
  ret double %0
}

define %string* @5(%string* %u) {
entry:
  ret %string* %u
}

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare i8* @_ZN2GC8allocateEj(i32)

define void @6(void (double)* %fn, double %v) {
entry:
  call void %fn(double %v)
  ret void
}

define void @7(double %v) {
entry:
  call void @_ZN7console3logIdEEvT_(double %v)
  ret void
}

declare void @_ZN7console3logIdEEvT_(double)

define void ()* @8() {
entry:
  ret void ()* @9
}

define void @9() {
entry:
  call void @_ZN7console3logIdEEvT_(double 2.200000e+01)
  ret void
}

define void @10() {
entry:
  call void @_ZN7console3logIdEEvT_(double 2.200000e+01)
  ret void
}
