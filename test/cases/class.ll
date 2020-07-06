; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%A__class = type { %B__class*, double }
%B__class = type { double }
%env___B__class__ = type { %B__class** }
%string = type { i64, i64, i64, i64 }

@0 = private unnamed_addr constant [4 x i8] c"foo\00"

define i32 @main() {
entry:
  %a = call %A__class* @A__class__constructor(double 4.000000e+00)
  %c = getelementptr inbounds %A__class, %A__class* %a, i32 0, i32 1
  store double 1.000000e+00, double* %c
  %b = getelementptr inbounds %A__class, %A__class* %a, i32 0, i32 0
  %b.load = load %B__class*, %B__class** %b
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %x = bitcast i8* %0 to %B__class**
  store %B__class* %b.load, %B__class** %x
  %x1 = insertvalue %env___B__class__ zeroinitializer, %B__class** %x, 0
  %1 = call i8* @_ZN2GC8allocateEj(i32 8)
  %2 = bitcast i8* %1 to %env___B__class__*
  store %env___B__class__ %x1, %env___B__class__* %2
  call void @A__class__a(%A__class* %a)
  ret i32 0
}

define %A__class* @A__class__constructor(double %b) {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 16)
  %1 = bitcast i8* %0 to %A__class*
  %b1 = getelementptr inbounds %A__class, %A__class* %1, i32 0, i32 0
  %2 = call %B__class* @B__class__constructor()
  store %B__class* %2, %B__class** %b1
  %c = getelementptr inbounds %A__class, %A__class* %1, i32 0, i32 1
  store double 0.000000e+00, double* %c
  %3 = call i8* @_ZN2GC8allocateEj(i32 8)
  %4 = bitcast i8* %3 to double*
  store double %b, double* %4
  ret %A__class* %1
}

declare i8* @_ZN2GC8allocateEj(i32)

define %B__class* @B__class__constructor() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 8)
  %1 = bitcast i8* %0 to %B__class*
  ret %B__class* %1
}

define void @A__class__a(%A__class* %this) {
entry:
  %b = getelementptr inbounds %A__class, %A__class* %this, i32 0, i32 0
  %b.load = load %B__class*, %B__class** %b
  %b1 = getelementptr inbounds %B__class, %B__class* %b.load, i32 0, i32 0
  %c = getelementptr inbounds %A__class, %A__class* %this, i32 0, i32 1
  %c.load = load double, double* %c
  store double %c.load, double* %b1
  %0 = call i8* @_ZN2GC8allocateEj(i32 32)
  %1 = bitcast i8* %0 to %string*
  %2 = call %string* @_ZN6stringC1EPKa(%string* %1, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  call void @_ZN7console3logIRK6stringEEvT_(%string* %1)
  ret void
}

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)
