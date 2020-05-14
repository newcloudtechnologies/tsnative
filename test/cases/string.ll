; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i256 }

@0 = private unnamed_addr constant [4 x i8] c"foo\00"
@1 = private unnamed_addr constant [4 x i8] c"123\00"
@2 = private unnamed_addr constant [4 x i8] c"AAA\00"
@3 = private unnamed_addr constant [4 x i8] c"   \00"
@4 = private unnamed_addr constant [7 x i8] c"123456\00"

define i32 @main() {
entry:
  %l = alloca i32
  %a = alloca %string*
  %0 = call i8* @_ZN2GC8allocateEj(i32 32)
  %1 = bitcast i8* %0 to %string*
  %2 = call %string* @_ZN6stringC1EPKa(%string* %1, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  store %string* %1, %string** %a
  %a.load = load %string*, %string** %a
  %a.load1 = load %string*, %string** %a
  %3 = call i8* @_ZN2GC8allocateEj(i32 32)
  %4 = bitcast i8* %3 to %string*
  %5 = call %string* @_ZNK6string6concatERKS_(%string* %4, %string* %a.load1, %string* %a.load)
  store %string* %4, %string** %a
  %a.load2 = load %string*, %string** %a
  %6 = call i8* @_ZN2GC8allocateEj(i32 32)
  %7 = bitcast i8* %6 to %string*
  %8 = call %string* @_ZN6stringC1EPKa(%string* %7, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0))
  %9 = call i8* @_ZN2GC8allocateEj(i32 32)
  %b = bitcast i8* %9 to %string*
  %10 = call %string* @_ZNK6string6concatERKS_(%string* %b, %string* %a.load2, %string* %7)
  %11 = call i8* @_ZN2GC8allocateEj(i32 32)
  %12 = bitcast i8* %11 to %string*
  %13 = call %string* @_ZN6stringC1EPKa(%string* %12, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0))
  %14 = call i8* @_ZN2GC8allocateEj(i32 32)
  %15 = bitcast i8* %14 to %string*
  %16 = call %string* @_ZN6stringC1EPKa(%string* %15, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @3, i32 0, i32 0))
  %17 = call i8* @_ZN2GC8allocateEj(i32 32)
  %18 = bitcast i8* %17 to %string*
  %19 = call %string* @_ZNK6string6concatERKS_(%string* %18, %string* %15, %string* %b)
  %20 = call i8* @_ZN2GC8allocateEj(i32 32)
  %21 = bitcast i8* %20 to %string*
  %22 = call %string* @_ZNK6string6concatERKS_(%string* %21, %string* %12, %string* %18)
  call void @_ZN7console3logIRK6stringEEvT_(%string* %21)
  %23 = call i8* @_ZN2GC8allocateEj(i32 32)
  %24 = bitcast i8* %23 to %string*
  %25 = call %string* @_ZN6stringC1EPKa(%string* %24, i8* getelementptr inbounds ([7 x i8], [7 x i8]* @4, i32 0, i32 0))
  %26 = call i32 @_ZNK6string6lengthEv(%string* %24)
  store i32 %26, i32* %l
  %27 = call i32 @_ZNK6string6lengthEv(%string* %b)
  %a.load3 = load %string*, %string** %a
  %28 = call i32 @_ZNK6string6lengthEv(%string* %a.load3)
  %a.load4 = load %string*, %string** %a
  %29 = call i8* @_ZN2GC8allocateEj(i32 32)
  %30 = bitcast i8* %29 to %string*
  %31 = call %string* @_ZNK6string6concatERKS_(%string* %30, %string* %a.load4, %string* %b)
  %32 = call i32 @_ZNK6string6lengthEv(%string* %30)
  ret i32 0
}

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZNK6string6concatERKS_(%string*, %string*, %string*)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare i32 @_ZNK6string6lengthEv(%string*)
