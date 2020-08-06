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
  %4 = bitcast i8* %3 to %string*
  %5 = call %string* @_ZNK6string6concatERKS_(%string* %4, %string* %1, %string* %1)
  %6 = load %string, %string* %4
  store %string %6, %string* %1
  %7 = call i8* @_ZN2GC8allocateEj(i32 32)
  %8 = bitcast i8* %7 to %string*
  %9 = call %string* @_ZN6stringC1EPKa(%string* %8, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @1, i32 0, i32 0))
  %10 = call i8* @_ZN2GC8allocateEj(i32 32)
  %b = bitcast i8* %10 to %string*
  %11 = call %string* @_ZNK6string6concatERKS_(%string* %b, %string* %1, %string* %8)
  %12 = call i8* @_ZN2GC8allocateEj(i32 32)
  %13 = bitcast i8* %12 to %string*
  %14 = call %string* @_ZN6stringC1EPKa(%string* %13, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @2, i32 0, i32 0))
  %15 = call i8* @_ZN2GC8allocateEj(i32 32)
  %16 = bitcast i8* %15 to %string*
  %17 = call %string* @_ZN6stringC1EPKa(%string* %16, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @3, i32 0, i32 0))
  %18 = call i8* @_ZN2GC8allocateEj(i32 32)
  %19 = bitcast i8* %18 to %string*
  %20 = call %string* @_ZNK6string6concatERKS_(%string* %19, %string* %16, %string* %b)
  %21 = call i8* @_ZN2GC8allocateEj(i32 32)
  %22 = bitcast i8* %21 to %string*
  %23 = call %string* @_ZNK6string6concatERKS_(%string* %22, %string* %13, %string* %19)
  call void @_ZN7console3logIRK6stringEEvT_(%string* %22)
  %24 = call i8* @_ZN2GC8allocateEj(i32 32)
  %25 = bitcast i8* %24 to %string*
  %26 = call %string* @_ZN6stringC1EPKa(%string* %25, i8* getelementptr inbounds ([7 x i8], [7 x i8]* @4, i32 0, i32 0))
  %27 = call i32 @_ZNK6string6lengthEv(%string* %25)
  %28 = call i32 @_ZNK6string6lengthEv(%string* %b)
  %29 = call i32 @_ZNK6string6lengthEv(%string* %1)
  %30 = call i8* @_ZN2GC8allocateEj(i32 32)
  %31 = bitcast i8* %30 to %string*
  %32 = call %string* @_ZNK6string6concatERKS_(%string* %31, %string* %1, %string* %b)
  %33 = call i32 @_ZNK6string6lengthEv(%string* %31)
  ret i32 0
}

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare i8* @_ZN2GC8allocateEj(i32)

declare %string* @_ZNK6string6concatERKS_(%string*, %string*, %string*)

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare i32 @_ZNK6string6lengthEv(%string*)
