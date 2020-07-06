; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i64, i64, i64, i64 }

@0 = private unnamed_addr constant [4 x i8] c"foo\00"
@1 = private unnamed_addr constant [4 x i8] c"123\00"
@2 = private unnamed_addr constant [4 x i8] c"AAA\00"
@3 = private unnamed_addr constant [4 x i8] c"   \00"
@4 = private unnamed_addr constant [7 x i8] c"123456\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 32)
  %1 = bitcast i8* %0 to %string*
  %2 = call %string* @_ZN6stringC1EPKa(%string* %1, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  %3 = call i8* @_ZN2GC8allocateEj(i32 32)
  %4 = bitcast i8* %3 to %string**
  store %string* %1, %string** %4
  %.load = load %string*, %string** %4
  %.load1 = load %string*, %string** %4
  %5 = call i8* @_ZN2GC8allocateEj(i32 32)
  %6 = bitcast i8* %5 to %string*
  %7 = call %string* @_ZNK6string6concatERKS_(%string* %6, %string* %.load1, %string* %.load)
  store %string* %6, %string** %4
  %.load2 = load %string*, %string** %4
  %8 = call i8* @_ZN2GC8allocateEj(i32 32)
  %9 = bitcast i8* %8 to %string*
  %10 = call %string* @_ZN6stringC1EPKa(%string* %9, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0))
  %11 = call i8* @_ZN2GC8allocateEj(i32 32)
  %b = bitcast i8* %11 to %string*
  %12 = call %string* @_ZNK6string6concatERKS_(%string* %b, %string* %.load2, %string* %9)
  %13 = call i8* @_ZN2GC8allocateEj(i32 32)
  %14 = bitcast i8* %13 to %string*
  %15 = call %string* @_ZN6stringC1EPKa(%string* %14, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0))
  %16 = call i8* @_ZN2GC8allocateEj(i32 32)
  %17 = bitcast i8* %16 to %string*
  %18 = call %string* @_ZN6stringC1EPKa(%string* %17, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @3, i32 0, i32 0))
  %19 = call i8* @_ZN2GC8allocateEj(i32 32)
  %20 = bitcast i8* %19 to %string*
  %21 = call %string* @_ZNK6string6concatERKS_(%string* %20, %string* %17, %string* %b)
  %22 = call i8* @_ZN2GC8allocateEj(i32 32)
  %23 = bitcast i8* %22 to %string*
  %24 = call %string* @_ZNK6string6concatERKS_(%string* %23, %string* %14, %string* %20)
  call void @_ZN7console3logIRK6stringEEvT_(%string* %23)
  %25 = call i8* @_ZN2GC8allocateEj(i32 32)
  %26 = bitcast i8* %25 to %string*
  %27 = call %string* @_ZN6stringC1EPKa(%string* %26, i8* getelementptr inbounds ([7 x i8], [7 x i8]* @4, i32 0, i32 0))
  %28 = call i32 @_ZNK6string6lengthEv(%string* %26)
  %29 = call i8* @_ZN2GC8allocateEj(i32 4)
  %30 = bitcast i8* %29 to i32*
  store i32 %28, i32* %30
  %31 = call i32 @_ZNK6string6lengthEv(%string* %b)
  %.load3 = load %string*, %string** %4
  %32 = call i32 @_ZNK6string6lengthEv(%string* %.load3)
  %.load4 = load %string*, %string** %4
  %33 = call i8* @_ZN2GC8allocateEj(i32 32)
  %34 = bitcast i8* %33 to %string*
  %35 = call %string* @_ZNK6string6concatERKS_(%string* %34, %string* %.load4, %string* %b)
  %36 = call i32 @_ZNK6string6lengthEv(%string* %34)
  ret i32 0
}

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZNK6string6concatERKS_(%string*, %string*, %string*)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare i32 @_ZNK6string6lengthEv(%string*)
