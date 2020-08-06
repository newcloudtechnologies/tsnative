; ModuleID = 'main'
source_filename = "main"
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64"

%"env__(_i1*_i1*_i1*)" = type { i1*, i1*, i1* }

define i32 @main() {
entry:
  %0 = call i8* @_ZN2GC8allocateEj(i32 1)
  %1 = bitcast i8* %0 to i1*
  store i1 false, i1* %1
  %2 = call i8* @_ZN2GC8allocateEj(i32 1)
  %3 = bitcast i8* %2 to i1*
  store i1 true, i1* %3
  %4 = call i8* @_ZN2GC8allocateEj(i32 1)
  %5 = bitcast i8* %4 to i1*
  store i1 false, i1* %5
  %6 = insertvalue %"env__(_i1*_i1*_i1*)" zeroinitializer, i1* %1, 0
  %7 = insertvalue %"env__(_i1*_i1*_i1*)" %6, i1* %3, 1
  %8 = insertvalue %"env__(_i1*_i1*_i1*)" %7, i1* %5, 2
  %9 = call i8* @_ZN2GC8allocateEj(i32 24)
  %10 = bitcast i8* %9 to %"env__(_i1*_i1*_i1*)"*
  store %"env__(_i1*_i1*_i1*)" %8, %"env__(_i1*_i1*_i1*)"* %10
  %11 = call i1* @foo(%"env__(_i1*_i1*_i1*)"* %10)
  ret i32 0
}

declare i8* @_ZN2GC8allocateEj(i32)

define i1* @foo(%"env__(_i1*_i1*_i1*)"* %__environment__) {
entry:
  %0 = load %"env__(_i1*_i1*_i1*)", %"env__(_i1*_i1*_i1*)"* %__environment__
  %1 = extractvalue %"env__(_i1*_i1*_i1*)" %0, 0
  %2 = load i1, i1* %1
  br i1 %2, label %then, label %else

then:                                             ; preds = %entry
  %3 = call i8* @_ZN2GC8allocateEj(i32 1)
  %4 = bitcast i8* %3 to i1*
  store i1 false, i1* %4
  ret i1* %4

else:                                             ; preds = %entry
  %5 = extractvalue %"env__(_i1*_i1*_i1*)" %0, 1
  %6 = load i1, i1* %5
  br i1 %6, label %then1, label %else2

endif:                                            ; preds = %endif3
  %7 = extractvalue %"env__(_i1*_i1*_i1*)" %0, 2
  ret i1* %7

then1:                                            ; preds = %else
  %8 = extractvalue %"env__(_i1*_i1*_i1*)" %0, 2
  %9 = load i1, i1* %8
  br i1 %9, label %then4, label %else5

else2:                                            ; preds = %else
  br label %endif3

endif3:                                           ; preds = %else2, %endif6
  br label %endif

then4:                                            ; preds = %then1
  %10 = call i8* @_ZN2GC8allocateEj(i32 1)
  %11 = bitcast i8* %10 to i1*
  store i1 true, i1* %11
  ret i1* %11

else5:                                            ; preds = %then1
  %12 = extractvalue %"env__(_i1*_i1*_i1*)" %0, 1
  ret i1* %12

endif6:                                           ; No predecessors!
  br label %endif3
}
