; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%B__class = type { double }
%A__class = type { %B__class*, double }
%string = type { i8*, i32 }

@0 = private unnamed_addr constant [4 x i8] c"foo\00"

define i32 @main() {
entry:
  %x = alloca %B__class*
  %a = call %A__class* @A__class__constructor(double 4.000000e+00)
  %c = getelementptr inbounds %A__class, %A__class* %a, i32 0, i32 1
  store double 1.000000e+00, double* %c
  %b = getelementptr inbounds %A__class, %A__class* %a, i32 0, i32 0
  %b.load = load %B__class*, %B__class** %b
  store %B__class* %b.load, %B__class** %x
  call void @A__class__a(%A__class* %a)
  ret i32 0
}

define %A__class* @A__class__constructor(double %b) {
entry:
  %a = alloca double
  %0 = call i8* @gc__allocate(i32 16)
  %1 = bitcast i8* %0 to %A__class*
  %b1 = getelementptr inbounds %A__class, %A__class* %1, i32 0, i32 0
  %2 = call %B__class* @B__class__constructor()
  store %B__class* %2, %B__class** %b1
  %c = getelementptr inbounds %A__class, %A__class* %1, i32 0, i32 1
  store double 0.000000e+00, double* %c
  store double %b, double* %a
  ret %A__class* %1
}

declare i8* @gc__allocate(i32)

define %B__class* @B__class__constructor() {
entry:
  %0 = call i8* @gc__allocate(i32 8)
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
  call void @_ZN7console3logI6stringEEvT_(%string { i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0), i32 3 })
  ret void
}

declare void @_ZN7console3logI6stringEEvT_(%string)
