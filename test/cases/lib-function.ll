; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%string = type { i256 }

@0 = private unnamed_addr constant [4 x i8] c"foo\00"

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 32)
  %1 = bitcast i8* %0 to %string*
  %2 = call %string* @_ZN6stringC1EPKa(%string* %1, i8* getelementptr inbounds ([4 x i8], [4 x i8]* @0, i32 0, i32 0))
  call void @_ZN7console3logIRK6stringEEvT_(%string* %1)
  ret i32 0
}

declare void @_ZN7console3logIRK6stringEEvT_(%string*)

declare %string* @_ZN6stringC1EPKa(%string*, i8*)

declare i8* @_ZN2GC8allocateEj(i32)
