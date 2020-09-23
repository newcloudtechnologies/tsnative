; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%A__class = type { %B__class*, double* }
%B__class = type { double* }
%"env__()" = type {}
%string = type { i64, i64, i64, i64 }

@0 = private unnamed_addr constant [4 x i8] c"foo\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to double*
  store double 4.000000e+00, double* %1
  %a = call %A__class* @A__class__constructor(double* %1)
  %c = getelementptr inbounds %A__class, %A__class* %a, i32 0, i32 1
  %2 = load double*, double** %c
  %3 = call i8* @_ZN2GC8allocateEj(i32 8)
  %4 = bitcast i8* %3 to double*
  store double 1.000000e+00, double* %4
  %5 = load double, double* %4
  store double %5, double* %2
  %b = getelementptr inbounds %A__class, %A__class* %a, i32 0, i32 0
  %6 = load %B__class*, %B__class** %b
  %7 = call i8* @_ZN2GC8allocateEj(i32 1)
  %8 = bitcast i8* %7 to %"env__()"*
  store %"env__()" zeroinitializer, %"env__()"* %8
  call void @A__class__a(%"env__()"* %8, %A__class* %a)
  ret i32 0
}

define %A__class* @A__class__constructor(double* %b) {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 16)
  %1 = bitcast i8* %0 to %A__class*
  %b1 = getelementptr inbounds %A__class, %A__class* %1, i32 0, i32 0
  %2 = load %B__class*, %B__class** %b1
  %3 = call %B__class* @B__class__constructor()
  %4 = load %B__class, %B__class* %3
  store %B__class %4, %B__class* %2
  %c = getelementptr inbounds %A__class, %A__class* %1, i32 0, i32 1
  %5 = load double*, double** %c
  %6 = call i8* @_ZN2GC8allocateEj(i32 8)
  %7 = bitcast i8* %6 to double*
  store double 0.000000e+00, double* %7
  %8 = load double, double* %7
  store double %8, double* %5
  ret %A__class* %1
}

declare i8* @_ZN2GC8allocateEj(i32)

define %B__class* @B__class__constructor() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to %B__class*
  ret %B__class* %1
}

define void @A__class__a(%"env__()"* %__environment__, %A__class* %this) {
entry:
  %0 = load %"env__()", %"env__()"* %__environment__
  %b = getelementptr inbounds %A__class, %A__class* %this, i32 0, i32 0
  %1 = load %B__class*, %B__class** %b
  %b1 = getelementptr inbounds %B__class, %B__class* %1, i32 0, i32 0
  %2 = load double*, double** %b1
  %c = getelementptr inbounds %A__class, %A__class* %this, i32 0, i32 1
  %3 = load double*, double** %c
  %4 = load double, double* %3
  store double %4, double* %2
  %5 = call i8* @_ZN2GC8allocateEj(i32 32)
  %6 = bitcast i8* %5 to %string*
  %7 = call %string* @_ZN6stringC1EPKa(%string* %6, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  call void @_ZN7console3logIRK6stringEEvT_(%string* %6)
  ret void
}

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)
